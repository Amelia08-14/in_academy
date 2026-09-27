import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { authenticate, requireRole, AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

router.use(authenticate, requireRole("TRAINER"));

// Résout le formateur (catalogue) lié au compte connecté.
async function getMyTrainerId(userId: string): Promise<string | null> {
  const profile = await prisma.trainerProfile.findUnique({ where: { userId } });
  return profile?.trainerId ?? null;
}

// GET /api/trainer-space/me
router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.trainerProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { trainer: true, user: { select: { email: true } } },
    });
    if (!profile) { res.status(404).json({ error: "Profil formateur introuvable" }); return; }
    res.json(profile);
  } catch (err) {
    console.error("[trainer-space me]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/trainer-space/sessions — sessions qui me sont assignées
router.get("/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = await getMyTrainerId(req.user!.userId);
    if (!trainerId) { res.json([]); return; }

    const sessions = await prisma.trainingSession.findMany({
      where: { trainerId },
      orderBy: { startDate: "desc" },
      include: {
        category: { select: { name: true } },
        formation: { select: { title: true } },
        _count: { select: { enrollments: { where: { status: "CONFIRMED" } }, materials: true } },
      },
    });
    res.json(sessions);
  } catch (err) {
    console.error("[trainer-space sessions]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/trainer-space/sessions/:id/materials
router.get("/sessions/:id/materials", async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = await getMyTrainerId(req.user!.userId);
    const sessionId = req.params["id"] as string;
    const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
    if (!session || !trainerId || session.trainerId !== trainerId) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }
    const materials = await prisma.sessionMaterial.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });
    res.json(materials);
  } catch (err) {
    console.error("[trainer-space materials get]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/trainer-space/sessions/:id/materials — ajouter un support de cours
router.post("/sessions/:id/materials", async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = await getMyTrainerId(req.user!.userId);
    const sessionId = req.params["id"] as string;
    const { title, fileUrl } = req.body as { title?: string; fileUrl?: string };
    if (!title || !fileUrl) {
      res.status(400).json({ error: "Titre et fichier requis" });
      return;
    }
    const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
    if (!session || !trainerId || session.trainerId !== trainerId) {
      res.status(404).json({ error: "Session introuvable" });
      return;
    }
    const material = await prisma.sessionMaterial.create({
      data: { sessionId, title: title.trim(), fileUrl },
    });
    res.status(201).json(material);
  } catch (err) {
    console.error("[trainer-space materials post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/trainer-space/materials/:id — retirer un support de cours
router.delete("/materials/:id", async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = await getMyTrainerId(req.user!.userId);
    const id = req.params["id"] as string;
    const material = await prisma.sessionMaterial.findUnique({
      where: { id },
      include: { session: { select: { trainerId: true } } },
    });
    if (!material || !trainerId || material.session.trainerId !== trainerId) {
      res.status(404).json({ error: "Support introuvable" });
      return;
    }
    await prisma.sessionMaterial.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[trainer-space materials delete]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
