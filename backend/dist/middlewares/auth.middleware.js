"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
const db_1 = require("../lib/db");
async function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token manquant" });
        return;
    }
    try {
        const token = header.slice(7);
        const payload = (0, jwt_1.verifyToken)(token);
        // Vérifie que le compte existe toujours et n'a pas été désactivé :
        // sinon un utilisateur désactivé garderait sa session valide jusqu'à expiration du token.
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isActive: true },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ error: "Compte désactivé ou introuvable. Veuillez vous reconnecter." });
            return;
        }
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
}
// Comme `authenticate`, mais ne bloque jamais la requête : utilisé sur des routes
// publiques (ex. inscription à un événement) qui se comportent différemment
// selon qu'un visiteur est connecté ou non, sans exiger de compte.
async function optionalAuthenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next();
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(header.slice(7));
        const user = await db_1.prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } });
        if (user?.isActive)
            req.user = payload;
    }
    catch {
        // Token invalide/expiré : on continue en visiteur anonyme plutôt que de bloquer.
    }
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: "Accès refusé" });
            return;
        }
        next();
    };
}
