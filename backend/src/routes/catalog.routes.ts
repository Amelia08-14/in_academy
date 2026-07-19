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

    const sessions = await prisma.trainingSession.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { startDate: "asc" },
      include: {
        category: true,
        formation: true,
        // Une place est "réservée" dès qu'une inscription est en attente ou confirmée.
        _count: { select: { enrollments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } },
      },
    });

    // "Complet" = toutes les places réservées. "En cours" = places encore disponibles.
    // L'ouverture ne dépend PAS de la date de début (une session du jour reste ouverte).
    const withState = sessions.map((s) => {
      const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments);
      const isFull = spotsLeft <= 0;
      const isOpen =
        OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) && !isFull;

      return { ...s, spotsLeft, isFull, isOpen, nextSessionId: null };
    });

    res.json(withState);
  } catch (err) {
    console.error("[sessions]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/sessions/:id — public, détail d'une session (page de lien d'inscription directe)
router.get("/sessions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const s = await prisma.trainingSession.findUnique({
      where: { id: (req.params["id"] as string) as string },
      include: {
        category: true,
        formation: true,
        _count: { select: { enrollments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } },
      },
    });

    if (!s) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }

    const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments);
    const isFull = spotsLeft <= 0;
    const isOpen =
      OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) && !isFull;

    res.json({ ...s, spotsLeft, isFull, isOpen });
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
