import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth.schema";
import { authenticate, AuthRequest } from "@/middlewares/auth.middleware";
import { sendPasswordResetEmail } from "@/lib/mail";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — "expiration raisonnable"
const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

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

// POST /api/auth/forgot-password — envoie un lien de réinitialisation par email.
// Réponse générique dans tous les cas (compte trouvé ou non) pour ne pas laisser
// deviner quels emails sont enregistrés.
router.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const genericResponse = {
    ok: true,
    message: "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.",
  };

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(rawToken),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
      const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${rawToken}`;
      void sendPasswordResetEmail({ to: user.email, resetUrl }).catch((err) =>
        console.error("[mail password-reset]", err)
      );
    }
    res.json(genericResponse);
  } catch (err) {
    console.error("[auth forgot-password]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/reset-password — consomme le token reçu par email.
router.post("/reset-password", async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const tokenHash = hashResetToken(parsed.data.token);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      res.status(400).json({ error: "Ce lien de réinitialisation est invalide ou a expiré." });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      // Les autres liens en attente pour ce compte sont invalidés — le nouveau mot de
      // passe rend caducs les liens précédemment envoyés.
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("[auth reset-password]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
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

// PATCH /api/auth/profile — l'apprenant connecté modifie ses propres informations
router.patch("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, jobTitle, birthDate } = req.body as {
      firstName?: string; lastName?: string; phone?: string | null;
      jobTitle?: string | null; birthDate?: string | null;
    };

    if (firstName !== undefined && firstName.trim().length < 2) {
      res.status(400).json({ error: "Prénom invalide" });
      return;
    }
    if (lastName !== undefined && lastName.trim().length < 2) {
      res.status(400).json({ error: "Nom invalide" });
      return;
    }

    const existing = await prisma.learnerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!existing) {
      res.status(404).json({ error: "Profil apprenant introuvable" });
      return;
    }

    const profile = await prisma.learnerProfile.update({
      where: { userId: req.user!.userId },
      data: {
        ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
        ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(jobTitle !== undefined ? { jobTitle: jobTitle || null } : {}),
        ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {}),
      },
    });
    res.json(profile);
  } catch (err) {
    console.error("[auth profile]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/auth/password — l'utilisateur connecté change son propre mot de passe
router.patch("/password", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "Mot de passe actuel requis et nouveau mot de passe d'au moins 8 caractères" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

    const match = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!match) {
      res.status(401).json({ error: "Mot de passe actuel incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth password]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
