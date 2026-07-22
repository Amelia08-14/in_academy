"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../lib/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const mail_1 = require("../lib/mail");
const content_schema_1 = require("../validations/content.schema");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("SUPER_ADMIN", "ADMIN", "MANAGER"));
function slugify(text) {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
    try {
        const [learnerCount, totalFormations, pendingEnrollments, pendingQuotes, totalCompanies, totalTrainers] = await Promise.all([
            db_1.prisma.user.count({ where: { role: "LEARNER" } }),
            db_1.prisma.formation.count({ where: { isActive: true } }),
            db_1.prisma.enrollment.count({ where: { status: "PENDING" } }),
            db_1.prisma.quoteRequest.count({ where: { status: "PENDING" } }),
            db_1.prisma.company.count(),
            db_1.prisma.trainer.count({ where: { isActive: true } }),
        ]);
        res.json({ totalUsers: learnerCount, totalFormations, pendingEnrollments, pendingQuotes, totalCompanies, totalTrainers });
    }
    catch (err) {
        console.error("[admin/stats]", err);
        res.status(500).json({ error: "Erreur serveur — base de données inaccessible. Vérifiez XAMPP et la migration." });
    }
});
// GET /api/admin/users
router.get("/users", async (_req, res) => {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                learnerProfile: true,
                companyAdmin: {
                    include: {
                        company: {
                            include: {
                                activityCategory: true,
                                _count: { select: { quoteRequests: true, enrollments: true } },
                            },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
            omit: { hashedPassword: true },
        });
        res.json(users);
    }
    catch (err) {
        console.error("[admin/users]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/admin/users — créer un utilisateur (admin, manager ou apprenant)
router.post("/users", async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone } = req.body;
        if (!email || !password || !role) {
            res.status(400).json({ error: "email, password et role sont requis" });
            return;
        }
        const validRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "LEARNER"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: "Rôle invalide" });
            return;
        }
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: "Cet email est déjà utilisé" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const isLearner = role === "LEARNER";
        const user = await db_1.prisma.user.create({
            data: {
                email,
                hashedPassword,
                role: role,
                ...(isLearner && firstName && lastName
                    ? {
                        learnerProfile: {
                            create: { firstName, lastName, phone: phone ?? null },
                        },
                    }
                    : {}),
            },
            include: { learnerProfile: true },
            omit: { hashedPassword: true },
        });
        res.status(201).json(user);
    }
    catch (err) {
        console.error("[admin/users post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/users/:id/toggle-active
router.patch("/users/:id/toggle-active", async (req, res) => {
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: req.params["id"] } });
        if (!user) {
            res.status(404).json({ error: "Utilisateur introuvable" });
            return;
        }
        const updated = await db_1.prisma.user.update({
            where: { id: req.params["id"] },
            data: { isActive: !user.isActive },
        });
        res.json({ isActive: updated.isActive });
    }
    catch (err) {
        console.error("[admin/users toggle]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/categories — branches (avec compteur de formations)
router.get("/categories", async (_req, res) => {
    try {
        const categories = await db_1.prisma.category.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { formations: true } } },
        });
        res.json(categories);
    }
    catch (err) {
        console.error("[admin/categories]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/admin/categories — créer une branche
router.post("/categories", async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || name.trim().length < 2) {
            res.status(400).json({ error: "Nom de la branche requis" });
            return;
        }
        const category = await db_1.prisma.category.create({
            data: { name: name.trim(), slug: slugify(name), description: description ?? null },
        });
        res.status(201).json(category);
    }
    catch (err) {
        console.error("[admin/categories post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/formations
router.get("/formations", async (_req, res) => {
    try {
        const formations = await db_1.prisma.formation.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                category: true,
                trainers: { include: { trainer: { select: { displayName: true } } } },
                _count: { select: { sessions: true } },
            },
        });
        res.json(formations);
    }
    catch (err) {
        console.error("[admin/formations]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/admin/formations — créer une formation
router.post("/formations", async (req, res) => {
    try {
        const { title, categoryId, description, duration, tjm, price, isCertifying, ficheTechniqueUrl, coverImageUrl } = req.body;
        if (!title || title.trim().length < 2 || !categoryId) {
            res.status(400).json({ error: "Titre et branche requis" });
            return;
        }
        const formation = await db_1.prisma.formation.create({
            data: {
                title: title.trim(),
                slug: slugify(title),
                categoryId,
                description: description ?? null,
                duration: duration ?? null,
                tjm: tjm ?? null,
                price: price ?? null,
                isCertifying: isCertifying ?? true,
                ficheTechniqueUrl: ficheTechniqueUrl ?? null,
                coverImageUrl: coverImageUrl ?? null,
            },
            include: { category: true },
        });
        res.status(201).json(formation);
    }
    catch (err) {
        console.error("[admin/formations post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/formations/:id — mettre à jour fiche technique / infos
router.patch("/formations/:id", async (req, res) => {
    try {
        const { ficheTechniqueUrl, tjm, price, duration, description, isActive, coverImageUrl } = req.body;
        const formation = await db_1.prisma.formation.update({
            where: { id: req.params["id"] },
            data: {
                ...(ficheTechniqueUrl !== undefined && { ficheTechniqueUrl }),
                ...(description !== undefined && { description }),
                ...(tjm !== undefined && { tjm }),
                ...(price !== undefined && { price }),
                ...(duration !== undefined && { duration }),
                ...(isActive !== undefined && { isActive }),
                ...(coverImageUrl !== undefined && { coverImageUrl }),
            },
        });
        res.json(formation);
    }
    catch (err) {
        console.error("[admin/formations patch]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/enrollments
router.get("/enrollments", async (_req, res) => {
    try {
        const enrollments = await db_1.prisma.enrollment.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: { include: { learnerProfile: true }, omit: { hashedPassword: true } },
                session: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        duration: true,
                        startDate: true,
                        location: true,
                        price: true,
                        maxCapacity: true,
                        category: { select: { name: true } },
                        formation: {
                            select: {
                                title: true,
                                description: true,
                                duration: true,
                                price: true,
                            },
                        },
                    },
                },
                formation: true,
                company: true,
                employees: true,
            },
        });
        res.json(enrollments);
    }
    catch (err) {
        console.error("[admin/enrollments]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/enrollments/:id/confirm
router.patch("/enrollments/:id/confirm", async (req, res) => {
    try {
        const id = req.params["id"];
        const existing = await db_1.prisma.enrollment.findUnique({
            where: { id },
            select: {
                status: true,
                sessionId: true,
                session: { select: { maxCapacity: true } },
            },
        });
        if (!existing) {
            res.status(404).json({ error: "Inscription introuvable" });
            return;
        }
        if (existing.session && existing.status !== "CONFIRMED") {
            const confirmedCount = await db_1.prisma.enrollment.count({
                where: { sessionId: existing.sessionId, status: "CONFIRMED" },
            });
            if (confirmedCount >= existing.session.maxCapacity) {
                res.status(409).json({ error: "Cette session est dÃ©jÃ  complÃ¨te" });
                return;
            }
        }
        const enrollment = await db_1.prisma.enrollment.update({
            where: { id },
            data: { status: "CONFIRMED", confirmedAt: new Date() },
            include: {
                user: { include: { learnerProfile: true } },
                session: {
                    select: {
                        title: true,
                        startDate: true,
                        location: true,
                        category: true,
                        formation: true,
                    },
                },
                formation: true,
            },
        });
        if (existing.status !== "CONFIRMED") {
            const learnerName = enrollment.user.learnerProfile
                ? `${enrollment.user.learnerProfile.firstName} ${enrollment.user.learnerProfile.lastName}`
                : enrollment.user.email;
            const formationTitle = enrollment.session?.title ?? enrollment.formation?.title ?? "Formation IN ACADEMY";
            void (0, mail_1.sendEnrollmentConfirmedEmail)({
                to: enrollment.user.email,
                learnerName,
                formationTitle,
                startDate: enrollment.session?.startDate ?? null,
                location: enrollment.session?.location ?? null,
            }).catch((err) => console.error("[mail admin enrollment confirmed]", err));
        }
        res.json(enrollment);
    }
    catch (err) {
        console.error("[admin/enrollments confirm]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/enrollments/:id/cancel
router.patch("/enrollments/:id/cancel", async (req, res) => {
    try {
        const enrollment = await db_1.prisma.enrollment.update({
            where: { id: req.params["id"] },
            data: { status: "CANCELLED" },
        });
        res.json(enrollment);
    }
    catch (err) {
        console.error("[admin/enrollments cancel]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// DELETE /api/admin/enrollments/:id
router.delete("/enrollments/:id", async (req, res) => {
    try {
        await db_1.prisma.enrollment.delete({ where: { id: req.params["id"] } });
        res.json({ success: true });
    }
    catch (err) {
        console.error("[admin/enrollments delete]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/enrollments/:id/reassign — déplacer une inscription vers une autre session
router.patch("/enrollments/:id/reassign", async (req, res) => {
    try {
        const id = req.params["id"];
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: "sessionId requis" });
            return;
        }
        const session = await db_1.prisma.trainingSession.findUnique({ where: { id: sessionId } });
        if (!session) {
            res.status(404).json({ error: "Session introuvable" });
            return;
        }
        const existing = await db_1.prisma.enrollment.findUnique({
            where: { id },
            select: { status: true },
        });
        if (!existing) {
            res.status(404).json({ error: "Inscription introuvable" });
            return;
        }
        if (existing.status === "CONFIRMED") {
            const confirmedCount = await db_1.prisma.enrollment.count({
                where: { sessionId, status: "CONFIRMED" },
            });
            if (confirmedCount >= session.maxCapacity) {
                res.status(409).json({ error: "Cette session est d\u00e9j\u00e0 compl\u00e8te" });
                return;
            }
        }
        const enrollment = await db_1.prisma.enrollment.update({
            where: { id },
            data: { sessionId, formationId: null },
        });
        res.json(enrollment);
    }
    catch (err) {
        console.error("[admin/enrollments reassign]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/quotes
router.get("/quotes", async (_req, res) => {
    try {
        const quotes = await db_1.prisma.quoteRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: { company: true, items: { include: { formation: true } } },
        });
        res.json(quotes);
    }
    catch (err) {
        console.error("[admin/quotes]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/contact-requests
router.get("/contact-requests", async (_req, res) => {
    try {
        const requests = await db_1.prisma.contactRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: { category: true },
        });
        res.json(requests);
    }
    catch (err) {
        console.error("[admin/contact-requests]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/admin/sessions
router.get("/sessions", async (_req, res) => {
    try {
        const sessions = await db_1.prisma.trainingSession.findMany({
            orderBy: { startDate: "desc" },
            include: {
                category: true,
                formation: true,
                _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
            },
        });
        res.json(sessions);
    }
    catch (err) {
        console.error("[admin/sessions]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/admin/sessions
router.post("/sessions", async (req, res) => {
    try {
        const { title, description, coverImageUrl, duration, price, categoryId, formationId, startDate, endDate, location, minCapacity, maxCapacity, } = req.body;
        if (!startDate || (!categoryId && !formationId)) {
            res.status(400).json({ error: "startDate et formation ou branche sont requis" });
            return;
        }
        const formation = formationId
            ? await db_1.prisma.formation.findUnique({ where: { id: formationId } })
            : null;
        if (formationId && !formation) {
            res.status(404).json({ error: "Formation introuvable" });
            return;
        }
        const resolvedCategoryId = formation?.categoryId ?? categoryId;
        const resolvedTitle = (title?.trim() || formation?.title)?.trim();
        if (!resolvedTitle || !resolvedCategoryId) {
            res.status(400).json({ error: "Titre et branche requis" });
            return;
        }
        const session = await db_1.prisma.trainingSession.create({
            data: {
                title: resolvedTitle,
                description: description ?? formation?.description ?? null,
                coverImageUrl: coverImageUrl ?? formation?.coverImageUrl ?? null,
                duration: duration ?? formation?.duration ?? null,
                price: price ?? formation?.price ?? null,
                categoryId: resolvedCategoryId,
                formationId: formation?.id ?? null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                location: location ?? null,
                minCapacity: minCapacity ?? 1,
                maxCapacity: maxCapacity ?? 20,
            },
            include: { category: true },
        });
        res.status(201).json(session);
    }
    catch (err) {
        console.error("[admin/sessions post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/sessions/:id
router.patch("/sessions/:id", async (req, res) => {
    try {
        const { title, description, coverImageUrl, duration, price, categoryId, formationId, startDate, endDate, location, minCapacity, maxCapacity, status, } = req.body;
        const validStatus = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
        if (status !== undefined && !validStatus.includes(status)) {
            res.status(400).json({ error: "Statut invalide" });
            return;
        }
        const formation = formationId
            ? await db_1.prisma.formation.findUnique({ where: { id: formationId } })
            : null;
        if (formationId && !formation) {
            res.status(404).json({ error: "Formation introuvable" });
            return;
        }
        const session = await db_1.prisma.trainingSession.update({
            where: { id: req.params["id"] },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(coverImageUrl !== undefined && { coverImageUrl }),
                ...(duration !== undefined && { duration }),
                ...(price !== undefined && { price }),
                ...(formationId !== undefined && { formationId }),
                ...(formation && {
                    categoryId: formation.categoryId,
                    title: title ?? formation.title,
                    description: description !== undefined ? description : formation.description,
                    coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : formation.coverImageUrl,
                    duration: duration !== undefined ? duration : formation.duration,
                    price: price !== undefined ? price : formation.price,
                }),
                ...(categoryId !== undefined && !formation && { categoryId }),
                ...(startDate !== undefined && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(location !== undefined && { location }),
                ...(minCapacity !== undefined && { minCapacity }),
                ...(maxCapacity !== undefined && { maxCapacity }),
                ...(status !== undefined && { status: status }),
            },
            include: { category: true, formation: true },
        });
        res.json(session);
    }
    catch (err) {
        console.error("[admin/sessions patch]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// DELETE /api/admin/sessions/:id — supprime une session et ses inscriptions liées
router.delete("/sessions/:id", async (req, res) => {
    try {
        const id = req.params["id"];
        // On retire d'abord les inscriptions rattachées pour éviter les contraintes.
        await db_1.prisma.enrollment.deleteMany({ where: { sessionId: id } });
        await db_1.prisma.trainingSession.delete({ where: { id } });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[admin/sessions delete]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/quotes/:id/status
router.patch("/quotes/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ["PENDING", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
        if (!valid.includes(status)) {
            res.status(400).json({ error: "Statut invalide" });
            return;
        }
        const quote = await db_1.prisma.quoteRequest.update({
            where: { id: req.params["id"] },
            data: { status, respondedAt: new Date() },
        });
        res.json(quote);
    }
    catch (err) {
        console.error("[admin/quotes status]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// ─── Candidatures collaborateur (tâche 8) ────────────────────────────────────
// GET /api/admin/trainer-applications
router.get("/trainer-applications", async (_req, res) => {
    try {
        const apps = await db_1.prisma.trainerApplication.findMany({
            orderBy: { createdAt: "desc" },
            include: { files: true },
        });
        res.json(apps);
    }
    catch (err) {
        console.error("[admin/trainer-applications]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/trainer-applications/:id — changer le statut de la candidature
router.patch("/trainer-applications/:id", async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ["PENDING", "REVIEWED", "ACCEPTED", "REJECTED"];
        if (!status || !valid.includes(status)) {
            res.status(400).json({ error: "Statut invalide" });
            return;
        }
        const app = await db_1.prisma.trainerApplication.update({
            where: { id: req.params["id"] },
            data: { status: status },
        });
        res.json(app);
    }
    catch (err) {
        console.error("[admin/trainer-applications patch]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// ─── Documents (reçus & dossiers — tâches 4 & 5) ─────────────────────────────
// GET /api/admin/documents — réception de tous les documents déposés
router.get("/documents", async (req, res) => {
    try {
        const { type } = req.query;
        const documents = await db_1.prisma.document.findMany({
            where: type === "RECU" || type === "DOSSIER_ADMIN" ? { type } : {},
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    include: { learnerProfile: true, companyAdmin: { include: { company: true } } },
                    omit: { hashedPassword: true },
                },
                enrollment: { include: { session: { select: { title: true } }, formation: { select: { title: true } } } },
            },
        });
        res.json(documents);
    }
    catch (err) {
        console.error("[admin/documents]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// ─── Partenaires / avantages (tâche 3) ───────────────────────────────────────
// GET /api/admin/partners
router.get("/partners", async (_req, res) => {
    try {
        const partners = await db_1.prisma.partner.findMany({ orderBy: { createdAt: "desc" } });
        res.json(partners);
    }
    catch (err) {
        console.error("[admin/partners]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/admin/partners
router.post("/partners", async (req, res) => {
    const parsed = content_schema_1.partnerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const partner = await db_1.prisma.partner.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description ?? null,
                discountRate: parsed.data.discountRate ?? null,
                contact: parsed.data.contact ?? null,
                isActive: parsed.data.isActive ?? true,
            },
        });
        res.status(201).json(partner);
    }
    catch (err) {
        console.error("[admin/partners post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/admin/partners/:id
router.patch("/partners/:id", async (req, res) => {
    const parsed = content_schema_1.partnerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const d = parsed.data;
        const partner = await db_1.prisma.partner.update({
            where: { id: req.params["id"] },
            data: {
                ...(d.name !== undefined && { name: d.name }),
                ...(d.description !== undefined && { description: d.description }),
                ...(d.discountRate !== undefined && { discountRate: d.discountRate }),
                ...(d.contact !== undefined && { contact: d.contact }),
                ...(d.isActive !== undefined && { isActive: d.isActive }),
            },
        });
        res.json(partner);
    }
    catch (err) {
        console.error("[admin/partners patch]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// DELETE /api/admin/partners/:id
router.delete("/partners/:id", async (req, res) => {
    try {
        await db_1.prisma.partner.delete({ where: { id: req.params["id"] } });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[admin/partners delete]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
