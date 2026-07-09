import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { authenticate, requireRole, AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

// GET /api/enrollments — admin : toutes / user : les siennes
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(req.user!.role);

    const enrollments = await prisma.enrollment.findMany({
      where: isAdmin ? {} : { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { learnerProfile: true }, omit: { hashedPassword: true } },
        session: { include: { formation: true } },
        formation: true,
      },
    });

    res.json(enrollments);
  } catch (err) {
    console.error("[enrollments GET]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/enrollments — inscription à une session ou à une formation directe
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, formationId, type } = req.body;

    if (!sessionId && !formationId) {
      res.status(400).json({ error: "sessionId ou formationId requis" });
      return;
    }

    if (sessionId) {
      const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
      if (!session) { res.status(404).json({ error: "Session introuvable" }); return; }

      if (["COMPLETED", "CANCELLED"].includes(session.status) || session.startDate.getTime() < Date.now()) {
        res.status(409).json({ error: "Cette session est clôturée" });
        return;
      }

      const currentCount = await prisma.enrollment.count({
        where: { sessionId, status: { in: ["PENDING", "CONFIRMED"] } },
      });
      if (currentCount >= session.maxCapacity) {
        res.status(409).json({ error: "Cette session est complète" });
        return;
      }

      // Vérifier doublon sans contrainte unique composée
      const existing = await prisma.enrollment.findFirst({
        where: { userId: req.user!.userId, sessionId },
      });
      if (existing) { res.status(409).json({ error: "Déjà inscrit à cette session" }); return; }
    }

    if (formationId) {
      const formation = await prisma.formation.findUnique({ where: { id: formationId } });
      if (!formation) { res.status(404).json({ error: "Formation introuvable" }); return; }

      const existing = await prisma.enrollment.findFirst({
        where: { userId: req.user!.userId, formationId, sessionId: null },
      });
      if (existing) { res.status(409).json({ error: "Déjà inscrit à cette formation" }); return; }
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId:     req.user!.userId,
        sessionId:  sessionId ?? null,
        formationId: formationId ?? null,
        type:       type ?? "INDIVIDUAL",
        status:     "PENDING",
      },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    console.error("[enrollments POST]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/enrollments/:id/confirm — admin seulement
router.patch(
  "/:id/confirm",
  authenticate,
  requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const enrollment = await prisma.enrollment.update({
        where: { id: req.params["id"] },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      res.json(enrollment);
    } catch (err) {
      console.error("[enrollments confirm]", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PATCH /api/enrollments/:id/cancel — admin seulement
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const enrollment = await prisma.enrollment.update({
        where: { id: req.params["id"] },
        data: { status: "CANCELLED" },
      });
      res.json(enrollment);
    } catch (err) {
      console.error("[enrollments cancel]", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

export default router;
