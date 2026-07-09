"use strict";
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
async function getCompanyForUser(userId) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        include: { companyAdmin: { include: { company: true } } },
    });
    return user?.companyAdmin?.company ?? null;
}
// POST /api/companies/register
router.post("/register", async (req, res) => {
    const parsed = auth_schema_1.companyRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const d = parsed.data;
    const existing = await db_1.prisma.user.findUnique({ where: { email: d.adminEmail } });
    if (existing) {
        res.status(409).json({ error: "Cet email est déjà utilisé" });
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(d.adminPassword, 12);
    const company = await db_1.prisma.company.create({
        data: {
            raisonSociale: d.raisonSociale,
            nif: d.nif ?? null,
            rc: d.rc ?? null,
            address: d.address ?? null,
            wilaya: d.wilaya ?? null,
            commune: d.commune ?? null,
            phone: d.phone ?? null,
            activityCategoryId: d.activityCategoryId ?? null,
            activityOther: d.activityOther ?? null,
            profiles: {
                create: {
                    firstName: d.adminFirstName,
                    lastName: d.adminLastName,
                    user: {
                        create: {
                            email: d.adminEmail,
                            hashedPassword,
                            role: "COMPANY_ADMIN",
                        },
                    },
                },
            },
        },
        include: { profiles: { include: { user: true } } },
    });
    const admin = company.profiles[0].user;
    const token = (0, jwt_1.signToken)({ userId: admin.id, email: admin.email, role: admin.role });
    res.status(201).json({ token, role: admin.role, companyId: company.id });
});
// GET /api/companies/my-quotes — devis de l'entreprise connectée
router.get("/my-quotes", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const quotes = await db_1.prisma.quoteRequest.findMany({
            where: { companyId: company.id },
            orderBy: { createdAt: "desc" },
            include: { items: { include: { formation: { select: { id: true, title: true, duration: true } } } } },
        });
        res.json({ company, quotes });
    }
    catch (err) {
        console.error("[companies/my-quotes]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/companies/quotes/:id/respond — l'entreprise accepte ou refuse un devis envoyé
router.patch("/quotes/:id/respond", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const { accept } = req.body;
        const quoteId = req.params["id"];
        const quote = await db_1.prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: { items: true },
        });
        if (!quote || quote.companyId !== company.id) {
            res.status(404).json({ error: "Devis introuvable" });
            return;
        }
        if (quote.status !== "SENT") {
            res.status(409).json({ error: "Ce devis n'est pas encore disponible pour réponse" });
            return;
        }
        const updated = await db_1.prisma.quoteRequest.update({
            where: { id: quoteId },
            data: { status: accept ? "ACCEPTED" : "REJECTED", respondedAt: new Date() },
        });
        if (accept) {
            await db_1.prisma.enrollment.createMany({
                data: quote.items.map((item) => ({
                    userId: req.user.userId,
                    formationId: item.formationId,
                    companyId: company.id,
                    type: "COMPANY",
                    status: "CONFIRMED",
                    confirmedAt: new Date(),
                })),
            });
        }
        res.json(updated);
    }
    catch (err) {
        console.error("[companies/quotes respond]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/companies/quotes — demander un devis pour une ou plusieurs formations
router.post("/quotes", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const { formationId, participants, preferredDate, message } = req.body;
        if (!formationId) {
            res.status(400).json({ error: "formationId requis" });
            return;
        }
        const formation = await db_1.prisma.formation.findUnique({ where: { id: formationId } });
        if (!formation) {
            res.status(404).json({ error: "Formation introuvable" });
            return;
        }
        const quote = await db_1.prisma.quoteRequest.create({
            data: {
                companyId: company.id,
                message: message ?? null,
                items: {
                    create: {
                        formationId,
                        participants: participants ?? 1,
                        preferredDate: preferredDate ?? null,
                    },
                },
            },
            include: { items: { include: { formation: true } } },
        });
        res.status(201).json(quote);
    }
    catch (err) {
        console.error("[companies/quotes post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/companies/my-enrollments — inscriptions de l'entreprise connectée
router.get("/my-enrollments", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const enrollments = await db_1.prisma.enrollment.findMany({
            where: { companyId: company.id },
            orderBy: { createdAt: "desc" },
            include: { formation: true, session: { include: { formation: true } }, employees: true },
        });
        res.json(enrollments);
    }
    catch (err) {
        console.error("[companies/my-enrollments]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/companies/enrollments/:id/employees — ajouter un employé à une formation inscrite
router.post("/enrollments/:id/employees", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const enrollment = await db_1.prisma.enrollment.findUnique({ where: { id: req.params["id"] } });
        if (!enrollment || enrollment.companyId !== company.id) {
            res.status(404).json({ error: "Inscription introuvable" });
            return;
        }
        const { firstName, lastName, email } = req.body;
        if (!firstName || !lastName) {
            res.status(400).json({ error: "Prénom et nom requis" });
            return;
        }
        const employee = await db_1.prisma.enrollmentEmployee.create({
            data: { enrollmentId: enrollment.id, firstName, lastName, email: email || null },
        });
        res.status(201).json(employee);
    }
    catch (err) {
        console.error("[companies/enrollments employees post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// DELETE /api/companies/enrollments/:id/employees/:employeeId
router.delete("/enrollments/:id/employees/:employeeId", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const company = await getCompanyForUser(req.user.userId);
        if (!company) {
            res.status(403).json({ error: "Compte entreprise requis" });
            return;
        }
        const enrollment = await db_1.prisma.enrollment.findUnique({ where: { id: req.params["id"] } });
        if (!enrollment || enrollment.companyId !== company.id) {
            res.status(404).json({ error: "Inscription introuvable" });
            return;
        }
        await db_1.prisma.enrollmentEmployee.delete({ where: { id: req.params["employeeId"] } });
        res.json({ success: true });
    }
    catch (err) {
        console.error("[companies/enrollments employees delete]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
