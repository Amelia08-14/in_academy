import { Router, Response } from "express";
import bcrypt from "bcryptjs";
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
        orderBy: { isPrimary: "desc" },
        include: {
          formation: {
            select: {
              id: true, title: true, slug: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      // Présence (sans détail) : permet à l'admin de savoir si ce formateur a déjà
      // un compte de connexion, sans exposer d'info sensible sur la route publique.
      trainerProfile: { select: { id: true } },
    },
  });
  res.json(trainers);
});

// GET /api/trainers/:id — public
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const trainer = await prisma.trainer.findUnique({
    where: { id: (req.params["id"] as string) },
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
    where: { id: (req.params["id"] as string) },
    data: parsed.data,
  });
  res.json(trainer);
});

// DELETE /api/trainers/:id — supprimer (soft: désactiver)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  await prisma.trainer.update({
    where: { id: (req.params["id"] as string) },
    data: { isActive: false },
  });
  res.json({ success: true });
});

// POST /api/trainers/:id/account — crée un compte de connexion (rôle TRAINER) pour ce
// formateur, afin qu'il accède à son espace formateur (sessions assignées, supports de cours).
router.post("/:id/account", async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = req.params["id"] as string;
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: "Email et mot de passe (8 caractères minimum) requis" });
      return;
    }

    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { trainerProfile: true },
    });
    if (!trainer) { res.status(404).json({ error: "Formateur introuvable" }); return; }
    if (trainer.trainerProfile) { res.status(409).json({ error: "Ce formateur a déjà un compte" }); return; }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) { res.status(409).json({ error: "Cet email est déjà utilisé" }); return; }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: "TRAINER",
        trainerProfile: {
          create: {
            trainerId: trainer.id,
            firstName: trainer.firstName,
            lastName: trainer.lastName,
            phone: trainer.phone,
          },
        },
      },
      include: { trainerProfile: true },
      omit: { hashedPassword: true },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error("[trainers account post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/trainers/:id/formations — lier/délier des formations
router.patch("/:id/formations", async (req: AuthRequest, res: Response) => {
  const { formationIds }: { formationIds: string[] } = req.body;
  const trainerId = (req.params["id"] as string);

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
