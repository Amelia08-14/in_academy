import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { loginSchema, registerSchema } from "@/validations/auth.schema";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, role: user.role });
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password, firstName, lastName, phone, jobTitle, birthDate } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      role: "LEARNER",
      learnerProfile: {
        create: {
          firstName,
          lastName,
          phone,
          jobTitle,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      },
    },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, role: user.role });
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  try {
    const { verifyToken } = await import("@/lib/jwt");
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { learnerProfile: true, companyAdmin: { include: { company: true } } },
    });
    if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
    const { hashedPassword: _, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

export default router;
