"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const mail_1 = require("../lib/mail");
const router = (0, express_1.Router)();
// GET /api/enrollments — admin : toutes / user : les siennes
router.get("/", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(req.user.role);
        const enrollments = await db_1.prisma.enrollment.findMany({
            where: isAdmin ? {} : { userId: req.user.userId },
            orderBy: { createdAt: "desc" },
            include: {
                user: { include: { learnerProfile: true }, omit: { hashedPassword: true } },
                session: { include: { formation: true } },
                formation: true,
            },
        });
        res.json(enrollments);
    }
    catch (err) {
        console.error("[enrollments GET]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/enrollments — inscription à une session ou à une formation directe
router.post("/", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { sessionId, formationId, type } = req.body;
        if (!sessionId && !formationId) {
            res.status(400).json({ error: "sessionId ou formationId requis" });
            return;
        }
        if (sessionId) {
            const session = await db_1.prisma.trainingSession.findUnique({ where: { id: sessionId } });
            if (!session) {
                res.status(404).json({ error: "Session introuvable" });
                return;
            }
            if (["COMPLETED", "CANCELLED"].includes(session.status) || session.startDate.getTime() < Date.now()) {
                res.status(409).json({ error: "Cette session est clôturée" });
                return;
            }
            const confirmedCount = await db_1.prisma.enrollment.count({
                where: { sessionId, status: "CONFIRMED" },
            });
            if (confirmedCount >= session.maxCapacity) {
                res.status(409).json({ error: "Cette session est complète" });
                return;
            }
            // Vérifier doublon sans contrainte unique composée
            const existing = await db_1.prisma.enrollment.findFirst({
                where: { userId: req.user.userId, sessionId },
            });
            if (existing) {
                res.status(409).json({ error: "Déjà inscrit à cette session" });
                return;
            }
        }
        if (formationId) {
            const formation = await db_1.prisma.formation.findUnique({ where: { id: formationId } });
            if (!formation) {
                res.status(404).json({ error: "Formation introuvable" });
                return;
            }
            const existing = await db_1.prisma.enrollment.findFirst({
                where: { userId: req.user.userId, formationId, sessionId: null },
            });
            if (existing) {
                res.status(409).json({ error: "Déjà inscrit à cette formation" });
                return;
            }
        }
        const enrollment = await db_1.prisma.enrollment.create({
            data: {
                userId: req.user.userId,
                sessionId: sessionId ?? null,
                formationId: formationId ?? null,
                type: type ?? "INDIVIDUAL",
                status: "PENDING",
            },
            include: {
                user: { include: { learnerProfile: true } },
                session: { include: { category: true, formation: true } },
                formation: true,
            },
        });
        const learnerName = enrollment.user.learnerProfile
            ? `${enrollment.user.learnerProfile.firstName} ${enrollment.user.learnerProfile.lastName}`
            : enrollment.user.email;
        const formationTitle = enrollment.session?.title ?? enrollment.formation?.title ?? "Formation IN ACADEMY";
        void (0, mail_1.sendEnrollmentPendingEmail)({
            to: enrollment.user.email,
            learnerName,
            formationTitle,
            startDate: enrollment.session?.startDate ?? null,
            location: enrollment.session?.location ?? null,
        }).catch((err) => console.error("[mail enrollment pending]", err));
        res.status(201).json(enrollment);
    }
    catch (err) {
        console.error("[enrollments POST]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/enrollments/:id/confirm — admin seulement
router.patch("/:id/confirm", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("SUPER_ADMIN", "ADMIN", "MANAGER"), async (req, res) => {
    try {
        const id = req.params["id"];
        const existing = await db_1.prisma.enrollment.findUnique({
            where: { id },
            include: { session: true },
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
                session: { include: { category: true, formation: true } },
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
            }).catch((err) => console.error("[mail enrollment confirmed]", err));
        }
        res.json(enrollment);
    }
    catch (err) {
        console.error("[enrollments confirm]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// PATCH /api/enrollments/:id/cancel — admin seulement
router.patch("/:id/cancel", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("SUPER_ADMIN", "ADMIN", "MANAGER"), async (req, res) => {
    try {
        const enrollment = await db_1.prisma.enrollment.update({
            where: { id: req.params["id"] },
            data: { status: "CANCELLED" },
        });
        res.json(enrollment);
    }
    catch (err) {
        console.error("[enrollments cancel]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
