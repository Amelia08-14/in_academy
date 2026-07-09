import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { authenticate, requireRole, AuthRequest } from "@/middlewares/auth.middleware";
import { z } from "zod";

const router = Router();

const trainerSchema = z.object({
  firstName:   z.string().min(2),
  lastName:    z.string().min(2),
  displayName: z.string().min(2),
  email:       z.email().optional().or(z.literal("")),
  phone:       z.string().optional(),
  speciality:  z.string().optional(),
  bio:         z.string().optional(),
  cvUrl:       z.string().optional(),
  isActive:    z.boolean().optional(),
});

// GET /api/trainers — public (liste pour catalogue)
router.get("/", async (_req: AuthRequest, res: Response) => {
  const trainers = await prisma.trainer.findMany({
    where: { isActive: true },
    orderBy: { lastName: "asc" },
    include: {
      formations: {
        include: { formation: { select: { id: true, title: true, slug: true } } },
      },
    },
  });
  res.json(trainers);
});

// GET /api/trainers/:id — public
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const trainer = await prisma.trainer.findUnique({
    where: { id: req.params["id"] },
    include: {
      formations: {
        include: { formation: { include: { category: true } } },
      },
    },
  });
  if (!trainer) { res.status(404).json({ error: "Formateur introuvable" }); return; }
  res.json(trainer);
});

// ── Routes admin ──────────────────────────────────────────────────────────────
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN", "MANAGER"));

// POST /api/trainers — créer un formateur
router.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = trainerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const data = parsed.data;
  const trainer = await prisma.trainer.create({
    data: {
      firstName:   data.firstName,
      lastName:    data.lastName,
      displayName: data.displayName,
      email:       data.email || null,
      phone:       data.phone || null,
      speciality:  data.speciality || null,
      bio:         data.bio || null,
      cvUrl:       data.cvUrl || null,
      isActive:    data.isActive ?? true,
    },
  });
  res.status(201).json(trainer);
});

// PATCH /api/trainers/:id — modifier
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const parsed = trainerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }
  const trainer = await prisma.trainer.update({
    where: { id: req.params["id"] },
    data: parsed.data,
  });
  res.json(trainer);
});

// DELETE /api/trainers/:id — supprimer (soft: désactiver)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  await prisma.trainer.update({
    where: { id: req.params["id"] },
    data: { isActive: false },
  });
  res.json({ success: true });
});

// PATCH /api/trainers/:id/formations — lier/délier des formations
router.patch("/:id/formations", async (req: AuthRequest, res: Response) => {
  const { formationIds }: { formationIds: string[] } = req.body;
  const trainerId = req.params["id"];

  // Supprimer les anciennes liaisons
  await prisma.formationTrainer.deleteMany({ where: { trainerId } });

  // Recréer les nouvelles
  if (formationIds?.length) {
    await prisma.formationTrainer.createMany({
      data: formationIds.map((formationId, i) => ({
        trainerId,
        formationId,
        isPrimary: i === 0,
      })),
      skipDuplicates: true,
    });
  }
  res.json({ success: true });
});

export default router;
