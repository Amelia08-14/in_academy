import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authenticate, requireRole, AuthRequest } from "@/middlewares/auth.middleware";
import { sendEnrollmentConfirmedEmail } from "@/lib/mail";

const router = Router();

router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"));

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/stats
router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const [learnerCount, totalFormations, pendingEnrollments, pendingQuotes, totalCompanies, totalTrainers] =
      await Promise.all([
        prisma.user.count({ where: { role: "LEARNER" } }),
        prisma.formation.count({ where: { isActive: true } }),
        prisma.enrollment.count({ where: { status: "PENDING" } }),
        prisma.quoteRequest.count({ where: { status: "PENDING" } }),
        prisma.company.count(),
        prisma.trainer.count({ where: { isActive: true } }),
      ]);
    res.json({ totalUsers: learnerCount, totalFormations, pendingEnrollments, pendingQuotes, totalCompanies, totalTrainers });
  } catch (err) {
    console.error("[admin/stats]", err);
    res.status(500).json({ error: "Erreur serveur — base de données inaccessible. Vérifiez XAMPP et la migration." });
  }
});

// GET /api/admin/users
router.get("/users", async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        learnerProfile: true,
        companyAdmin: {
          include: {
            company: {
              include: {
                activityCategory: true,
                _count: { select: { quoteRequests: true, enrollments: true } },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
      omit: { hashedPassword: true },
    });
    res.json(users);
  } catch (err) {
    console.error("[admin/users]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/users — créer un utilisateur (admin, manager ou apprenant)
router.post("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body as {
      email: string; password: string; role: string;
      firstName?: string; lastName?: string; phone?: string;
    };

    if (!email || !password || !role) {
      res.status(400).json({ error: "email, password et role sont requis" });
      return;
    }

    const validRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "LEARNER"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Rôle invalide" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Cet email est déjà utilisé" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const isLearner = role === "LEARNER";

    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: role as "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "LEARNER",
        ...(isLearner && firstName && lastName
          ? {
              learnerProfile: {
                create: { firstName, lastName, phone: phone ?? null },
              },
            }
          : {}),
      },
      include: { learnerProfile: true },
      omit: { hashedPassword: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("[admin/users post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch("/users/:id/toggle-active", async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req.params["id"] as string) } });
    if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
    const updated = await prisma.user.update({
      where: { id: (req.params["id"] as string) },
      data: { isActive: !user.isActive },
    });
    res.json({ isActive: updated.isActive });
  } catch (err) {
    console.error("[admin/users toggle]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/categories — branches (avec compteur de formations)
router.get("/categories", async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { formations: true } } },
    });
    res.json(categories);
  } catch (err) {
    console.error("[admin/categories]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/categories — créer une branche
router.post("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: "Nom de la branche requis" });
      return;
    }
    const category = await prisma.category.create({
      data: { name: name.trim(), slug: slugify(name), description: description ?? null },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error("[admin/categories post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/formations
router.get("/formations", async (_req: AuthRequest, res: Response) => {
  try {
    const formations = await prisma.formation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        trainers: { include: { trainer: { select: { displayName: true } } } },
        _count: { select: { sessions: true } },
      },
    });
    res.json(formations);
  } catch (err) {
    console.error("[admin/formations]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/formations — créer une formation
router.post("/formations", async (req: AuthRequest, res: Response) => {
  try {
    const { title, categoryId, description, duration, price, isCertifying, ficheTechniqueUrl, coverImageUrl } = req.body as {
      title: string;
      categoryId: string;
      description?: string;
      duration?: string;
      price?: number;
      isCertifying?: boolean;
      ficheTechniqueUrl?: string;
      coverImageUrl?: string;
    };
    if (!title || title.trim().length < 2 || !categoryId) {
      res.status(400).json({ error: "Titre et branche requis" });
      return;
    }
    const formation = await prisma.formation.create({
      data: {
        title: title.trim(),
        slug: slugify(title),
        categoryId,
        description: description ?? null,
        duration: duration ?? null,
        price: price ?? null,
        isCertifying: isCertifying ?? true,
        ficheTechniqueUrl: ficheTechniqueUrl ?? null,
        coverImageUrl: coverImageUrl ?? null,
      },
      include: { category: true },
    });
    res.status(201).json(formation);
  } catch (err) {
    console.error("[admin/formations post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/formations/:id — mettre à jour fiche technique / infos
router.patch("/formations/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { ficheTechniqueUrl, price, duration, description, isActive, coverImageUrl } = req.body as {
      ficheTechniqueUrl?: string;
      price?: number;
      duration?: string;
      description?: string;
      isActive?: boolean;
      coverImageUrl?: string;
    };
    const formation = await prisma.formation.update({
      where: { id: (req.params["id"] as string) },
      data: {
        ...(ficheTechniqueUrl !== undefined && { ficheTechniqueUrl }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(duration !== undefined && { duration }),
        ...(isActive !== undefined && { isActive }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
      },
    });
    res.json(formation);
  } catch (err) {
    console.error("[admin/formations patch]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/enrollments
router.get("/enrollments", async (_req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { learnerProfile: true }, omit: { hashedPassword: true } },
        session: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            startDate: true,
            location: true,
            price: true,
            maxCapacity: true,
            category: { select: { name: true } },
            formation: {
              select: {
                title: true,
                description: true,
                duration: true,
                price: true,
              },
            },
          },
        },
        formation: true,
        company: true,
        employees: true,
      },
    });
    res.json(enrollments);
  } catch (err) {
    console.error("[admin/enrollments]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/enrollments/:id/confirm
router.patch("/enrollments/:id/confirm", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const existing = await prisma.enrollment.findUnique({
      where: { id },
      select: {
        status: true,
        sessionId: true,
        session: { select: { maxCapacity: true } },
      },
    });

    if (!existing) {
      res.status(404).json({ error: "Inscription introuvable" });
      return;
    }

    if (existing.session && existing.status !== "CONFIRMED") {
      const confirmedCount = await prisma.enrollment.count({
        where: { sessionId: existing.sessionId, status: "CONFIRMED" },
      });

      if (confirmedCount >= existing.session.maxCapacity) {
        res.status(409).json({ error: "Cette session est dÃ©jÃ  complÃ¨te" });
        return;
      }
    }

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: {
        user: { include: { learnerProfile: true } },
        session: {
          select: {
            title: true,
            startDate: true,
            location: true,
            category: true,
            formation: true,
          },
        },
        formation: true,
      },
    });

    if (existing.status !== "CONFIRMED") {
      const learnerName = enrollment.user.learnerProfile
        ? `${enrollment.user.learnerProfile.firstName} ${enrollment.user.learnerProfile.lastName}`
        : enrollment.user.email;
      const formationTitle = enrollment.session?.title ?? enrollment.formation?.title ?? "Formation IN ACADEMY";

      void sendEnrollmentConfirmedEmail({
        to: enrollment.user.email,
        learnerName,
        formationTitle,
        startDate: enrollment.session?.startDate ?? null,
        location: enrollment.session?.location ?? null,
      }).catch((err) => console.error("[mail admin enrollment confirmed]", err));
    }

    res.json(enrollment);
  } catch (err) {
    console.error("[admin/enrollments confirm]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/enrollments/:id/cancel
router.patch("/enrollments/:id/cancel", async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: (req.params["id"] as string) },
      data: { status: "CANCELLED" },
    });
    res.json(enrollment);
  } catch (err) {
    console.error("[admin/enrollments cancel]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/enrollments/:id
router.delete("/enrollments/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.enrollment.delete({ where: { id: (req.params["id"] as string) } });
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/enrollments delete]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/quotes
router.get("/quotes", async (_req: AuthRequest, res: Response) => {
  try {
    const quotes = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true, items: { include: { formation: true } } },
    });
    res.json(quotes);
  } catch (err) {
    console.error("[admin/quotes]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/contact-requests
router.get("/contact-requests", async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
    res.json(requests);
  } catch (err) {
    console.error("[admin/contact-requests]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/sessions
router.get("/sessions", async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.trainingSession.findMany({
      orderBy: { startDate: "desc" },
      include: { category: true, formation: true, _count: { select: { enrollments: true } } },
    });
    res.json(sessions);
  } catch (err) {
    console.error("[admin/sessions]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/sessions
router.post("/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, coverImageUrl, duration, price, categoryId, formationId,
      startDate, endDate, location, minCapacity, maxCapacity,
    } = req.body as {
      title?: string; description?: string; coverImageUrl?: string; duration?: string;
      price?: number | null; categoryId?: string; formationId?: string | null; startDate: string; endDate?: string; location?: string;
      minCapacity?: number; maxCapacity?: number;
    };

    if (!startDate || (!categoryId && !formationId)) {
      res.status(400).json({ error: "startDate et formation ou branche sont requis" });
      return;
    }

    const formation = formationId
      ? await prisma.formation.findUnique({ where: { id: formationId } })
      : null;

    if (formationId && !formation) {
      res.status(404).json({ error: "Formation introuvable" });
      return;
    }

    const resolvedCategoryId = formation?.categoryId ?? categoryId;
    const resolvedTitle = (title?.trim() || formation?.title)?.trim();

    if (!resolvedTitle || !resolvedCategoryId) {
      res.status(400).json({ error: "Titre et branche requis" });
      return;
    }

    const session = await prisma.trainingSession.create({
      data: {
        title: resolvedTitle,
        description: description ?? formation?.description ?? null,
        coverImageUrl: coverImageUrl ?? formation?.coverImageUrl ?? null,
        duration: duration ?? formation?.duration ?? null,
        price: price ?? formation?.price ?? null,
        categoryId: resolvedCategoryId,
        formationId: formation?.id ?? null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location ?? null,
        minCapacity: minCapacity ?? 1,
        maxCapacity: maxCapacity ?? 20,
      },
      include: { category: true },
    });
    res.status(201).json(session);
  } catch (err) {
    console.error("[admin/sessions post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/sessions/:id
router.patch("/sessions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, coverImageUrl, duration, price, categoryId, formationId,
      startDate, endDate, location, minCapacity, maxCapacity, status,
    } = req.body as {
      title?: string; description?: string; coverImageUrl?: string; duration?: string;
      price?: number | null; categoryId?: string; formationId?: string | null; startDate?: string; endDate?: string | null; location?: string;
      minCapacity?: number; maxCapacity?: number; status?: string;
    };

    const validStatus = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
    if (status !== undefined && !validStatus.includes(status)) {
      res.status(400).json({ error: "Statut invalide" });
      return;
    }

    const formation = formationId
      ? await prisma.formation.findUnique({ where: { id: formationId } })
      : null;

    if (formationId && !formation) {
      res.status(404).json({ error: "Formation introuvable" });
      return;
    }

    const session = await prisma.trainingSession.update({
      where: { id: (req.params["id"] as string) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(duration !== undefined && { duration }),
        ...(price !== undefined && { price }),
        ...(formationId !== undefined && { formationId }),
        ...(formation && {
          categoryId: formation.categoryId,
          title: title ?? formation.title,
          description: description !== undefined ? description : formation.description,
          coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : formation.coverImageUrl,
          duration: duration !== undefined ? duration : formation.duration,
          price: price !== undefined ? price : formation.price,
        }),
        ...(categoryId !== undefined && !formation && { categoryId }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location !== undefined && { location }),
        ...(minCapacity !== undefined && { minCapacity }),
        ...(maxCapacity !== undefined && { maxCapacity }),
        ...(status !== undefined && { status: status as "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" }),
      },
      include: { category: true, formation: true },
    });
    res.json(session);
  } catch (err) {
    console.error("[admin/sessions patch]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/sessions/:id — supprime une session et ses inscriptions liées
router.delete("/sessions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    // On retire d'abord les inscriptions rattachées pour éviter les contraintes.
    await prisma.enrollment.deleteMany({ where: { sessionId: id } });
    await prisma.trainingSession.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/sessions delete]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/quotes/:id/status
router.patch("/quotes/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const valid = ["PENDING", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
    if (!valid.includes(status)) { res.status(400).json({ error: "Statut invalide" }); return; }
    const quote = await prisma.quoteRequest.update({
      where: { id: (req.params["id"] as string) },
      data: { status, respondedAt: new Date() },
    });
    res.json(quote);
  } catch (err) {
    console.error("[admin/quotes status]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
