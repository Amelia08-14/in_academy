"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const mail_1 = require("../lib/mail");
const content_schema_1 = require("../validations/content.schema");
const router = (0, express_1.Router)();
// POST /api/documents — l'utilisateur dépose un reçu de paiement ou un dossier admin (tâches 4 & 5)
router.post("/", auth_middleware_1.authenticate, async (req, res) => {
    const parsed = content_schema_1.documentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const { type, fileUrl, originalName, enrollmentId } = parsed.data;
        const document = await db_1.prisma.document.create({
            data: {
                type,
                fileUrl,
                originalName: originalName ?? null,
                userId: req.user.userId,
                enrollmentId: enrollmentId ?? null,
            },
        });
        // Email admin à chaque dépôt de reçu (tâche 4).
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { learnerProfile: true, companyAdmin: { include: { company: true } } },
        });
        const who = user?.companyAdmin?.company.raisonSociale ??
            (user?.learnerProfile ? `${user.learnerProfile.firstName} ${user.learnerProfile.lastName}` : user?.email ?? "Utilisateur");
        const label = type === "RECU" ? "Reçu de paiement" : "Dossier administratif";
        void (0, mail_1.sendAdminNotificationEmail)(`Nouveau document : ${label}`, [
            `${who} (${user?.email}) vient de déposer un ${label.toLowerCase()}.`,
            originalName ? `Fichier : ${originalName}` : "",
            "Consultez-le depuis le back-office → Documents.",
        ].filter(Boolean)).catch((err) => console.error("[mail admin document]", err));
        res.status(201).json(document);
    }
    catch (err) {
        console.error("[documents post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/documents — les documents de l'utilisateur connecté
router.get("/", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const documents = await db_1.prisma.document.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(documents);
    }
    catch (err) {
        console.error("[documents get]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// DELETE /api/documents/:id — l'utilisateur retire un de ses documents
router.delete("/:id", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = req.params["id"];
        const doc = await db_1.prisma.document.findUnique({ where: { id } });
        if (!doc || doc.userId !== req.user.userId) {
            res.status(404).json({ error: "Document introuvable" });
            return;
        }
        await db_1.prisma.document.delete({ where: { id } });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[documents delete]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
