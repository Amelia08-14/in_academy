"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const content_schema_1 = require("../validations/content.schema");
const mail_1 = require("../lib/mail");
const router = (0, express_1.Router)();
const OPEN_SESSION_STATUS = ["SCHEDULED", "ONGOING"];
// GET /api/partners — public, avantages partenaires actifs (espace client, tâche 3)
router.get("/partners", async (_req, res) => {
    try {
        const partners = await db_1.prisma.partner.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, description: true, discountRate: true, contact: true },
        });
        res.json(partners);
    }
    catch (err) {
        console.error("[partners]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/events — public, événements publiés ("Nos Events")
router.get("/events", async (_req, res) => {
    try {
        const events = await db_1.prisma.event.findMany({
            where: { isPublished: true },
            orderBy: { eventDate: "desc" },
            include: { photos: true },
        });
        res.json(events);
    }
    catch (err) {
        console.error("[events]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/events/:id/register — public, inscription à un événement (sans compte requis)
router.post("/events/:id/register", async (req, res) => {
    const parsed = content_schema_1.eventRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const eventId = req.params["id"];
        const event = await db_1.prisma.event.findUnique({ where: { id: eventId } });
        if (!event || !event.isPublished) {
            res.status(404).json({ error: "Événement introuvable" });
            return;
        }
        if (event.eventDate < new Date()) {
            res.status(409).json({ error: "Cet événement est déjà passé, l'inscription n'est plus possible." });
            return;
        }
        const existing = await db_1.prisma.eventRegistration.findUnique({
            where: { eventId_email: { eventId, email: parsed.data.email } },
        });
        if (existing) {
            res.status(409).json({ error: "Vous êtes déjà inscrit(e) à cet événement." });
            return;
        }
        const registration = await db_1.prisma.eventRegistration.create({
            data: { eventId, ...parsed.data },
        });
        void (0, mail_1.sendEventRegistrationEmail)({
            to: registration.email,
            fullName: registration.fullName,
            eventTitle: event.title,
            eventDate: event.eventDate,
            location: event.location,
        }).catch((err) => console.error("[mail event-registration]", err));
        void (0, mail_1.sendAdminNotificationEmail)(`Nouvelle inscription — ${event.title}`, [
            `${registration.fullName} (${registration.email}) vient de s'inscrire à "${event.title}".`,
            registration.phone ? `Téléphone : ${registration.phone}` : "",
            "Consultez la liste des inscrits depuis le back-office → Nos Events.",
        ].filter(Boolean)).catch((err) => console.error("[mail admin event-registration]", err));
        res.status(201).json(registration);
    }
    catch (err) {
        console.error("[events register]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/categories — public, catalogue complet (branches + formations)
router.get("/categories", async (req, res) => {
    try {
        const { metier } = req.query;
        const metierFilter = metier === "true" ? { isMetier: true }
            : metier === "false" ? { isMetier: false }
                : {};
        const categories = await db_1.prisma.category.findMany({
            where: metierFilter,
            orderBy: { name: "asc" },
            include: {
                formations: {
                    where: { isActive: true },
                    orderBy: { title: "asc" },
                },
            },
        });
        res.json(categories);
    }
    catch (err) {
        console.error("[categories]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/sessions — public, sessions ouvertes groupées par branche
// pour les sessions clôturées visibles (récentes), on résout la prochaine
// session de même titre + même branche si elle existe.
router.get("/sessions", async (req, res) => {
    try {
        const { categoryId, metier } = req.query;
        // metier=true → uniquement les sessions "Formations Métiers" ; metier=false → les autres.
        const metierFilter = metier === "true" ? { category: { isMetier: true } }
            : metier === "false" ? { category: { isMetier: false } }
                : {};
        const sessions = await db_1.prisma.trainingSession.findMany({
            where: {
                ...(categoryId ? { categoryId } : {}),
                ...metierFilter,
            },
            orderBy: { startDate: "asc" },
            include: {
                category: true,
                formation: true,
                // Une place est "réservée" dès qu'une inscription est en attente ou confirmée.
                _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
            },
        });
        // "Complet" = toutes les places réservées. "En cours" = places encore disponibles.
        // L'ouverture ne dépend PAS de la date de début (une session du jour reste ouverte).
        const withState = sessions.map((s) => {
            const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments);
            const isFull = spotsLeft <= 0;
            const isOpen = OPEN_SESSION_STATUS.includes(s.status) && !isFull;
            return { ...s, spotsLeft, isFull, isOpen, nextSessionId: null };
        });
        res.json(withState);
    }
    catch (err) {
        console.error("[sessions]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/sessions/:id — public, détail d'une session (page de lien d'inscription directe)
router.get("/sessions/:id", async (req, res) => {
    try {
        const s = await db_1.prisma.trainingSession.findUnique({
            where: { id: req.params["id"] },
            include: {
                category: true,
                formation: true,
                _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
            },
        });
        if (!s) {
            res.status(404).json({ error: "Session introuvable" });
            return;
        }
        const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments);
        const isFull = spotsLeft <= 0;
        const isOpen = OPEN_SESSION_STATUS.includes(s.status) && !isFull;
        res.json({ ...s, spotsLeft, isFull, isOpen });
    }
    catch (err) {
        console.error("[sessions/:id]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/contact-requests — public, formulaire de contact simple (/inscrire)
router.post("/contact-requests", async (req, res) => {
    try {
        const { nom, prenom, telephone, email, statut, categoryId, formationName, message } = req.body;
        const validStatuts = ["ENTREPRISE", "ENTREPRENEUR", "SALARIE", "ETUDIANT", "AUTRE"];
        if (!nom || !prenom || !telephone || !email || !statut || !message) {
            res.status(400).json({ error: "Tous les champs obligatoires doivent être renseignés" });
            return;
        }
        if (!validStatuts.includes(statut)) {
            res.status(400).json({ error: "Statut invalide" });
            return;
        }
        const contactRequest = await db_1.prisma.contactRequest.create({
            data: {
                nom, prenom, telephone, email,
                statut: statut,
                categoryId: categoryId || null,
                formationName: formationName || null,
                message,
            },
        });
        res.status(201).json(contactRequest);
    }
    catch (err) {
        console.error("[contact-requests post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
