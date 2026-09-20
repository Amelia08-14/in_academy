"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const content_schema_1 = require("../validations/content.schema");
const mail_1 = require("../lib/mail");
const ACTIVE_REGISTRATION_STATUSES = ["PENDING", "CONFIRMED"];
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
// Auth facultative : si connecté, chaque événement porte `myStatus` (le statut de
// l'inscription de ce visiteur, ou null) pour que le front adapte le bouton
// (S'inscrire / En attente / Confirmé) sans rouvrir un formulaire déjà répondu.
router.get("/events", auth_middleware_1.optionalAuthenticate, async (req, res) => {
    try {
        const events = await db_1.prisma.event.findMany({
            where: { isPublished: true },
            orderBy: { eventDate: "desc" },
            include: {
                photos: true,
                _count: { select: { registrations: { where: { status: { in: ACTIVE_REGISTRATION_STATUSES } } } } },
            },
        });
        const myStatusByEvent = new Map();
        if (req.user) {
            const mine = await db_1.prisma.eventRegistration.findMany({
                where: { userId: req.user.userId },
                select: { eventId: true, status: true },
            });
            for (const r of mine)
                myStatusByEvent.set(r.eventId, r.status);
        }
        res.json(events.map((ev) => ({
            ...ev,
            registeredCount: ev._count.registrations,
            myStatus: myStatusByEvent.get(ev.id) ?? null,
        })));
    }
    catch (err) {
        console.error("[events]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// GET /api/events/:slug — public, page de détail d'un événement
router.get("/events/:slug", async (req, res) => {
    try {
        const event = await db_1.prisma.event.findUnique({
            where: { slug: req.params["slug"] },
            include: {
                photos: true,
                _count: { select: { registrations: { where: { status: { in: ACTIVE_REGISTRATION_STATUSES } } } } },
            },
        });
        if (!event || !event.isPublished) {
            res.status(404).json({ error: "Événement introuvable" });
            return;
        }
        res.json({ ...event, registeredCount: event._count.registrations });
    }
    catch (err) {
        console.error("[events detail]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/events/:id/register — inscription à un événement (statut PENDING,
// validée ensuite par un admin — voir PATCH /api/admin/events/registrations/:id).
// Connecté : nom/email repris automatiquement du compte, téléphone pré-rempli
// mais modifiable. Non connecté : nom/email/téléphone requis dans le corps.
// Dans les deux cas, type de profil / entreprise / fonction / domaine d'activité
// sont saisis à chaque inscription (jamais déduits du compte) et obligatoires.
router.post("/events/:id/register", auth_middleware_1.optionalAuthenticate, async (req, res) => {
    let fullName;
    let email;
    let phone;
    let userId = null;
    let registrantType;
    let companyName;
    let jobTitle;
    let activityDomain;
    if (req.user) {
        const account = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { learnerProfile: true },
        });
        if (!account) {
            res.status(401).json({ error: "Compte introuvable" });
            return;
        }
        const extra = content_schema_1.eventRegistrationExtraSchema.safeParse(req.body);
        if (!extra.success) {
            res.status(400).json({ errors: extra.error.flatten().fieldErrors });
            return;
        }
        fullName = account.learnerProfile
            ? `${account.learnerProfile.firstName} ${account.learnerProfile.lastName}`
            : account.email;
        email = account.email;
        phone = extra.data.phone || account.learnerProfile?.phone || null;
        if (!phone) {
            res.status(400).json({ errors: { phone: ["Téléphone requis"] } });
            return;
        }
        userId = account.id;
        registrantType = extra.data.registrantType;
        companyName = extra.data.companyName?.trim() || null;
        jobTitle = extra.data.jobTitle;
        activityDomain = extra.data.activityDomain;
    }
    else {
        const parsed = content_schema_1.eventRegistrationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        fullName = parsed.data.fullName;
        email = parsed.data.email;
        phone = parsed.data.phone;
        registrantType = parsed.data.registrantType;
        companyName = parsed.data.companyName?.trim() || null;
        jobTitle = parsed.data.jobTitle;
        activityDomain = parsed.data.activityDomain;
    }
    try {
        const eventId = req.params["id"];
        const event = await db_1.prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: { where: { status: { in: ACTIVE_REGISTRATION_STATUSES } } } } } },
        });
        if (!event || !event.isPublished) {
            res.status(404).json({ error: "Événement introuvable" });
            return;
        }
        if (event.eventDate < new Date()) {
            res.status(409).json({ error: "Cet événement est déjà passé, l'inscription n'est plus possible." });
            return;
        }
        if (event.capacity !== null && event._count.registrations >= event.capacity) {
            res.status(409).json({ error: "Cet événement est complet." });
            return;
        }
        const existing = await db_1.prisma.eventRegistration.findUnique({
            where: { eventId_email: { eventId, email } },
        });
        if (existing) {
            res.status(409).json({ error: "Vous êtes déjà inscrit(e) à cet événement." });
            return;
        }
        const registration = await db_1.prisma.eventRegistration.create({
            data: { eventId, fullName, email, phone, userId, registrantType, companyName, jobTitle, activityDomain },
        });
        void (0, mail_1.sendEventRegistrationPendingEmail)({
            to: registration.email,
            fullName: registration.fullName,
            eventTitle: event.title,
            eventDate: event.eventDate,
            location: event.location,
        }).catch((err) => console.error("[mail event-registration pending]", err));
        void (0, mail_1.sendAdminNotificationEmail)(`Nouvelle inscription — ${event.title}`, [
            `${registration.fullName} (${registration.email}) vient de s'inscrire à "${event.title}".`,
            `Profil : ${registration.registrantType === "COMPANY" ? "Entreprise" : "Particulier"}`,
            registration.companyName ? `Entreprise : ${registration.companyName}` : "",
            `Téléphone : ${registration.phone}`,
            `Fonction : ${registration.jobTitle}`,
            `Domaine d'activité : ${registration.activityDomain}`,
            "Validez ou refusez l'inscription depuis le back-office → Nos Events.",
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
                // Places prises : inscriptions avec compte confirmées + inscriptions directes confirmées.
                _count: {
                    select: {
                        enrollments: { where: { status: "CONFIRMED" } },
                        registrations: { where: { status: "CONFIRMED" } },
                    },
                },
            },
        });
        // "Complet" = toutes les places réservées. "En cours" = places encore disponibles.
        // L'ouverture ne dépend PAS de la date de début (une session du jour reste ouverte).
        const withState = sessions.map((s) => {
            const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments - s._count.registrations);
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
                _count: {
                    select: {
                        enrollments: { where: { status: "CONFIRMED" } },
                        registrations: { where: { status: "CONFIRMED" } },
                    },
                },
            },
        });
        if (!s) {
            res.status(404).json({ error: "Session introuvable" });
            return;
        }
        const spotsLeft = Math.max(0, s.maxCapacity - s._count.enrollments - s._count.registrations);
        const isFull = spotsLeft <= 0;
        const isOpen = OPEN_SESSION_STATUS.includes(s.status) && !isFull;
        res.json({ ...s, spotsLeft, isFull, isOpen });
    }
    catch (err) {
        console.error("[sessions/:id]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// POST /api/sessions/:id/register — inscription directe à une session (landing page métier),
// sans compte requis : nom, prénom, email, téléphone, niveau d'étude. Statut PENDING,
// validée ensuite par un admin. Un visiteur connecté garde le lien avec son compte.
router.post("/sessions/:id/register", auth_middleware_1.optionalAuthenticate, async (req, res) => {
    const parsed = content_schema_1.sessionRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const sessionId = req.params["id"];
        const session = await db_1.prisma.trainingSession.findUnique({
            where: { id: sessionId },
            include: {
                _count: {
                    select: {
                        enrollments: { where: { status: "CONFIRMED" } },
                        registrations: { where: { status: "CONFIRMED" } },
                    },
                },
            },
        });
        if (!session) {
            res.status(404).json({ error: "Session introuvable" });
            return;
        }
        if (!OPEN_SESSION_STATUS.includes(session.status)) {
            res.status(409).json({ error: "Cette session n'est plus ouverte aux inscriptions." });
            return;
        }
        if (session._count.enrollments + session._count.registrations >= session.maxCapacity) {
            res.status(409).json({ error: "Cette session est complète." });
            return;
        }
        const { firstName, lastName, email, phone, educationLevel } = parsed.data;
        const existing = await db_1.prisma.sessionRegistration.findUnique({
            where: { sessionId_email: { sessionId, email } },
        });
        if (existing) {
            res.status(409).json({ error: "Une demande d'inscription existe déjà avec cet email pour cette session." });
            return;
        }
        const registration = await db_1.prisma.sessionRegistration.create({
            data: { sessionId, userId: req.user?.userId ?? null, firstName, lastName, email, phone, educationLevel },
        });
        void (0, mail_1.sendSessionRegistrationPendingEmail)({
            to: registration.email,
            fullName: `${registration.firstName} ${registration.lastName}`,
            sessionTitle: session.title,
            startDate: session.startDate,
            location: session.location,
        }).catch((err) => console.error("[mail session-registration pending]", err));
        void (0, mail_1.sendAdminNotificationEmail)(`Nouvelle inscription — ${session.title}`, [
            `${registration.firstName} ${registration.lastName} (${registration.email}) souhaite s'inscrire à "${session.title}".`,
            `Téléphone : ${registration.phone}`,
            `Niveau d'étude : ${registration.educationLevel}`,
            "Validez ou refusez l'inscription depuis le back-office → Sessions → Inscrits.",
        ]).catch((err) => console.error("[mail admin session-registration]", err));
        res.status(201).json({ id: registration.id, status: registration.status });
    }
    catch (err) {
        console.error("[sessions register]", err);
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
