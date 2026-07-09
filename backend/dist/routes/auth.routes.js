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
    const { email, password, firstName, lastName, phone, jobTitle } = parsed.data;
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
                create: { firstName, lastName, phone, jobTitle },
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
exports.default = router;
