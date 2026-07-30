"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../lib/db");
const jwt_1 = require("../lib/jwt");
const auth_schema_1 = require("../validations/auth.schema");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post("/login", async (req, res) => {
    const parsed = auth_schema_1.loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, password } = parsed.data;
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
    }
    const match = await bcryptjs_1.default.compare(password, user.hashedPassword);
    if (!match) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
    }
    const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
    res.json({ token, role: user.role });
});
// POST /api/auth/register
router.post("/register", async (req, res) => {
    const parsed = auth_schema_1.registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, password, firstName, lastName, phone, jobTitle, birthDate } = parsed.data;
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: "Cet email est déjà utilisé" });
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await db_1.prisma.user.create({
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
    const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, role: user.role });
});
// GET /api/auth/me
router.get("/me", async (req, res) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Non authentifié" });
        return;
    }
    try {
        const { verifyToken } = await Promise.resolve().then(() => __importStar(require("../lib/jwt")));
        const payload = verifyToken(header.slice(7));
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.userId },
            include: { learnerProfile: true, companyAdmin: { include: { company: true } } },
        });
        if (!user) {
            res.status(404).json({ error: "Utilisateur introuvable" });
            return;
        }
        const { hashedPassword: _, ...safeUser } = user;
        res.json(safeUser);
    }
    catch {
        res.status(401).json({ error: "Token invalide" });
    }
});
// PATCH /api/auth/profile — l'apprenant connecté modifie ses propres informations
router.patch("/profile", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { firstName, lastName, phone, jobTitle, birthDate } = req.body;
        if (firstName !== undefined && firstName.trim().length < 2) {
            res.status(400).json({ error: "Prénom invalide" });
            return;
        }
        if (lastName !== undefined && lastName.trim().length < 2) {
            res.status(400).json({ error: "Nom invalide" });
            return;
        }
        const existing = await db_1.prisma.learnerProfile.findUnique({ where: { userId: req.user.userId } });
        if (!existing) {
            res.status(404).json({ error: "Profil apprenant introuvable" });
            return;
        }
        const profile = await db_1.prisma.learnerProfile.update({
            where: { userId: req.user.userId },
            data: {
                ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
                ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
                ...(phone !== undefined ? { phone: phone || null } : {}),
                ...(jobTitle !== undefined ? { jobTitle: jobTitle || null } : {}),
                ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {}),
            },
        });
        res.json(profile);
    }
    catch (err) {
        console.error("[auth profile]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/auth/password — l'utilisateur connecté change son propre mot de passe
router.patch("/password", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            res.status(400).json({ error: "Mot de passe actuel requis et nouveau mot de passe d'au moins 8 caractères" });
            return;
        }
        const user = await db_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: "Utilisateur introuvable" });
            return;
        }
        const match = await bcryptjs_1.default.compare(currentPassword, user.hashedPassword);
        if (!match) {
            res.status(401).json({ error: "Mot de passe actuel incorrect" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await db_1.prisma.user.update({ where: { id: user.id }, data: { hashedPassword } });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[auth password]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
