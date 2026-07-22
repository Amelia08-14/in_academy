import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { companyRegisterSchema } from "@/validations/auth.schema";
import { authenticate, AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

async function getCompanyForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { companyAdmin: { include: { company: true } } },
  });
  return user?.companyAdmin?.company ?? null;
}

// POST /api/companies/register
router.post("/register", async (req: Request, res: Response) => {
  const parsed = companyRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.adminEmail } });
  if (existing) {
    res.status(409).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const hashedPassword = await bcrypt.hash(d.adminPassword, 12);

  const company = await prisma.company.create({
    data: {
      raisonSociale: d.raisonSociale,
      nif: d.nif ?? null,
      rc: d.rc ?? null,
      address: d.address ?? null,
      wilaya: d.wilaya ?? null,
      commune: d.commune ?? null,
      phone: d.phone ?? null,
      activityCategoryId: d.activityCategoryId ?? null,
      activityOther: d.activityOther ?? null,
      profiles: {
        create: {
          firstName: d.adminFirstName,
          lastName: d.adminLastName,
          user: {
            create: {
              email: d.adminEmail,
              hashedPassword,
              role: "COMPANY_ADMIN",
            },
          },
        },
      },
    },
    include: { profiles: { include: { user: true } } },
  });

  const admin = company.profiles[0].user;
  const token = signToken({ userId: admin.id, email: admin.email, role: admin.role });
  res.status(201).json({ token, role: admin.role, companyId: company.id });
});

// GET /api/companies/my-quotes — devis de l'entreprise connectée
router.get("/my-quotes", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const quotes = await prisma.quoteRequest.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { formation: { select: { id: true, title: true, duration: true } } } } },
    });
    res.json({ company, quotes });
  } catch (err) {
    console.error("[companies/my-quotes]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/companies/quotes/:id/respond — l'entreprise accepte ou refuse un devis envoyé
router.patch("/quotes/:id/respond", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const { accept } = req.body as { accept: boolean };
    const quoteId = (req.params["id"] as string) as string;
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });
    if (!quote || quote.companyId !== company.id) {
      res.status(404).json({ error: "Devis introuvable" });
      return;
    }
    if (quote.status !== "SENT") {
      res.status(409).json({ error: "Ce devis n'est pas encore disponible pour réponse" });
      return;
    }

    const updated = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: { status: accept ? "ACCEPTED" : "REJECTED", respondedAt: new Date() },
    });

    if (accept) {
      await prisma.enrollment.createMany({
        data: quote.items.map((item) => ({
          userId: req.user!.userId,
          formationId: item.formationId,
          companyId: company.id,
          type: "COMPANY" as const,
          status: "CONFIRMED" as const,
          confirmedAt: new Date(),
        })),
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("[companies/quotes respond]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/companies/quotes — demander un devis pour une ou plusieurs formations
router.post("/quotes", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const { formationId, participants, preferredDate, message, items } = req.body as {
      formationId?: string;
      participants?: number;
      preferredDate?: string;
      message?: string;
      items?: { formationId: string; participants?: number; preferredDate?: string }[];
    };

    // Deux modes : panier multi-formations (`items`) ou formation unique (`formationId`).
    const cartItems = items && items.length > 0
      ? items
      : formationId
        ? [{ formationId, participants, preferredDate }]
        : [];

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Au moins une formation est requise" });
      return;
    }

    // Vérifie que toutes les formations existent.
    const ids = cartItems.map((i) => i.formationId);
    const found = await prisma.formation.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (found.length !== new Set(ids).size) {
      res.status(404).json({ error: "Une des formations est introuvable" });
      return;
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        companyId: company.id,
        message: message ?? null,
        items: {
          create: cartItems.map((i) => ({
            formationId: i.formationId,
            participants: i.participants && i.participants > 0 ? i.participants : 1,
            preferredDate: i.preferredDate ?? null,
          })),
        },
      },
      include: { items: { include: { formation: true } } },
    });
    res.status(201).json(quote);
  } catch (err) {
    console.error("[companies/quotes post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/companies/my-enrollments — inscriptions de l'entreprise connectée
router.get("/my-enrollments", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const enrollments = await prisma.enrollment.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      include: { formation: true, session: { include: { formation: true } }, employees: true },
    });
    res.json(enrollments);
  } catch (err) {
    console.error("[companies/my-enrollments]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/companies/enrollments/:id/employees — ajouter un employé à une formation inscrite
router.post("/enrollments/:id/employees", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const enrollment = await prisma.enrollment.findUnique({ where: { id: (req.params["id"] as string) } });
    if (!enrollment || enrollment.companyId !== company.id) {
      res.status(404).json({ error: "Inscription introuvable" });
      return;
    }

    const { firstName, lastName, email } = req.body as { firstName: string; lastName: string; email?: string };
    if (!firstName || !lastName) {
      res.status(400).json({ error: "Prénom et nom requis" });
      return;
    }

    const employee = await prisma.enrollmentEmployee.create({
      data: { enrollmentId: enrollment.id, firstName, lastName, email: email || null },
    });
    res.status(201).json(employee);
  } catch (err) {
    console.error("[companies/enrollments employees post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/companies/enrollments/:id/employees/:employeeId
router.delete("/enrollments/:id/employees/:employeeId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const company = await getCompanyForUser(req.user!.userId);
    if (!company) { res.status(403).json({ error: "Compte entreprise requis" }); return; }

    const enrollment = await prisma.enrollment.findUnique({ where: { id: (req.params["id"] as string) } });
    if (!enrollment || enrollment.companyId !== company.id) {
      res.status(404).json({ error: "Inscription introuvable" });
      return;
    }

    await prisma.enrollmentEmployee.delete({ where: { id: (req.params["employeeId"] as string) } });
    res.json({ success: true });
  } catch (err) {
    console.error("[companies/enrollments employees delete]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
