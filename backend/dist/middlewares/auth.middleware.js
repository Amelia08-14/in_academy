"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token manquant" });
        return;
    }
    try {
        const token = header.slice(7);
        req.user = (0, jwt_1.verifyToken)(token);
        next();
    }
    catch {
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
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
