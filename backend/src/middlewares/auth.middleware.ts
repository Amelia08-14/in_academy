import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);

    // Vérifie que le compte existe toujours et n'a pas été désactivé :
    // sinon un utilisateur désactivé garderait sa session valide jusqu'à expiration du token.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Compte désactivé ou introuvable. Veuillez vous reconnecter." });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }
    next();
  };
}
