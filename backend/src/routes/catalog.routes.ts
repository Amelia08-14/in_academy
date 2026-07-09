import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

type SessionStatusValue = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
const OPEN_SESSION_STATUS: SessionStatusValue[] = ["SCHEDULED", "ONGOING"];

// GET /api/categories — public, catalogue complet (branches + formations)
router.get("/categories", async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        formations: {
          where: { isActive: true },
          orderBy: { title: "asc" },
        },
      },
    });
    res.json(categories);
  } catch (err) {
    console.error("[categories]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/sessions — public, sessions ouvertes groupées par branche
// pour les sessions clôturées visibles (récentes), on résout la prochaine
// session de même titre + même branche si elle existe.
router.get("/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.query as { categoryId?: string };
    const now = new Date();

    const sessions = await prisma.trainingSession.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { startDate: "asc" },
      include: { category: true, _count: { select: { enrollments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } } },
    });

    const withState = await Promise.all(
      sessions.map(async (s) => {
        const spotsLeft = s.maxCapacity - s._count.enrollments;
        const isOpen =
          OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) &&
          s.startDate.getTime() >= now.getTime() &&
          spotsLeft > 0;

        let nextSessionId: string | null = null;
        if (!isOpen) {
          const next = await prisma.trainingSession.findFirst({
            where: {
              id: { not: s.id },
              categoryId: s.categoryId,
              title: { equals: s.title },
              startDate: { gt: now },
              status: { in: OPEN_SESSION_STATUS },
            },
            orderBy: { startDate: "asc" },
          });
          nextSessionId = next?.id ?? null;
        }

        return { ...s, spotsLeft, isOpen, nextSessionId };
      })
    );

    res.json(withState);
  } catch (err) {
    console.error("[sessions]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/sessions/:id — public, détail d'une session (page de lien d'inscription directe)
router.get("/sessions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const s = await prisma.trainingSession.findUnique({
      where: { id: (req.params["id"] as string) as string },
      include: { category: true, _count: { select: { enrollments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } } },
    });

    if (!s) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }

    const spotsLeft = s.maxCapacity - s._count.enrollments;
    const isOpen =
      OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) &&
      s.startDate.getTime() >= now.getTime() &&
      spotsLeft > 0;

    res.json({ ...s, spotsLeft, isOpen });
  } catch (err) {
    console.error("[sessions/:id]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/contact-requests — public, formulaire de contact simple (/inscrire)
router.post("/contact-requests", async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, telephone, email, statut, categoryId, formationName, message } = req.body as {
      nom: string; prenom: string; telephone: string; email: string;
      statut: string; categoryId?: string; formationName?: string; message: string;
    };

    const validStatuts = ["ENTREPRISE", "ENTREPRENEUR", "SALARIE", "ETUDIANT", "AUTRE"];
    if (!nom || !prenom || !telephone || !email || !statut || !message) {
      res.status(400).json({ error: "Tous les champs obligatoires doivent être renseignés" });
      return;
    }
    if (!validStatuts.includes(statut)) {
      res.status(400).json({ error: "Statut invalide" });
      return;
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        nom, prenom, telephone, email,
        statut: statut as "ENTREPRISE" | "ENTREPRENEUR" | "SALARIE" | "ETUDIANT" | "AUTRE",
        categoryId: categoryId || null,
        formationName: formationName || null,
        message,
      },
    });
    res.status(201).json(contactRequest);
  } catch (err) {
    console.error("[contact-requests post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
