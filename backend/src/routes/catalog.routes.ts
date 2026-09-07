import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { AuthRequest, optionalAuthenticate } from "@/middlewares/auth.middleware";
import { eventRegistrationSchema, eventRegistrationExtraSchema } from "@/validations/content.schema";
import { sendEventRegistrationPendingEmail, sendAdminNotificationEmail } from "@/lib/mail";

// Inscriptions qui occupent réellement une place — un refus libère le quota.
type EventRegistrationStatusValue = "PENDING" | "CONFIRMED" | "REJECTED";
const ACTIVE_REGISTRATION_STATUSES: EventRegistrationStatusValue[] = ["PENDING", "CONFIRMED"];

const router = Router();

type SessionStatusValue = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
const OPEN_SESSION_STATUS: SessionStatusValue[] = ["SCHEDULED", "ONGOING"];

// GET /api/partners — public, avantages partenaires actifs (espace client, tâche 3)
router.get("/partners", async (_req: AuthRequest, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, description: true, discountRate: true, contact: true },
    });
    res.json(partners);
  } catch (err) {
    console.error("[partners]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/events — public, événements publiés ("Nos Events")
// Auth facultative : si connecté, chaque événement porte `myStatus` (le statut de
// l'inscription de ce visiteur, ou null) pour que le front adapte le bouton
// (S'inscrire / En attente / Confirmé) sans rouvrir un formulaire déjà répondu.
router.get("/events", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { eventDate: "desc" },
      include: {
        photos: true,
        _count: { select: { registrations: { where: { status: { in: ACTIVE_REGISTRATION_STATUSES } } } } },
      },
    });

    const myStatusByEvent = new Map<string, string>();
    if (req.user) {
      const mine = await prisma.eventRegistration.findMany({
        where: { userId: req.user.userId },
        select: { eventId: true, status: true },
      });
      for (const r of mine) myStatusByEvent.set(r.eventId, r.status);
    }

    res.json(events.map((ev) => ({
      ...ev,
      registeredCount: ev._count.registrations,
      myStatus: myStatusByEvent.get(ev.id) ?? null,
    })));
  } catch (err) {
    console.error("[events]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/events/:slug — public, page de détail d'un événement
router.get("/events/:slug", async (req: AuthRequest, res: Response) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params["slug"] as string },
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
  } catch (err) {
    console.error("[events detail]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/events/:id/register — inscription à un événement (statut PENDING,
// validée ensuite par un admin — voir PATCH /api/admin/events/registrations/:id).
// Connecté : nom/email/téléphone repris automatiquement du compte.
// Non connecté : nom/email/téléphone requis dans le corps (inscription invité).
// Dans les deux cas, fonction/domaine de formation restent saisis dans le corps.
router.post("/events/:id/register", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  let fullName: string;
  let email: string;
  let phone: string | null;
  let userId: string | null = null;
  let jobTitle: string | null;
  let trainingDomain: string | null;

  if (req.user) {
    const account = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { learnerProfile: true },
    });
    if (!account) { res.status(401).json({ error: "Compte introuvable" }); return; }

    const extra = eventRegistrationExtraSchema.safeParse(req.body);
    if (!extra.success) {
      res.status(400).json({ errors: extra.error.flatten().fieldErrors });
      return;
    }

    fullName = account.learnerProfile
      ? `${account.learnerProfile.firstName} ${account.learnerProfile.lastName}`
      : account.email;
    email = account.email;
    phone = account.learnerProfile?.phone ?? null;
    userId = account.id;
    jobTitle = extra.data.jobTitle ?? account.learnerProfile?.jobTitle ?? null;
    trainingDomain = extra.data.trainingDomain ?? null;
  } else {
    const parsed = eventRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }
    fullName = parsed.data.fullName;
    email = parsed.data.email;
    phone = parsed.data.phone ?? null;
    jobTitle = parsed.data.jobTitle ?? null;
    trainingDomain = parsed.data.trainingDomain ?? null;
  }

  try {
    const eventId = req.params["id"] as string;
    const event = await prisma.event.findUnique({
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

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_email: { eventId, email } },
    });
    if (existing) {
      res.status(409).json({ error: "Vous êtes déjà inscrit(e) à cet événement." });
      return;
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId, fullName, email, phone, userId, jobTitle, trainingDomain },
    });

    void sendEventRegistrationPendingEmail({
      to: registration.email,
      fullName: registration.fullName,
      eventTitle: event.title,
      eventDate: event.eventDate,
      location: event.location,
    }).catch((err) => console.error("[mail event-registration pending]", err));

    void sendAdminNotificationEmail(`Nouvelle inscription — ${event.title}`, [
      `${registration.fullName} (${registration.email}) vient de s'inscrire à "${event.title}".`,
      registration.phone ? `Téléphone : ${registration.phone}` : "",
      registration.jobTitle ? `Fonction : ${registration.jobTitle}` : "",
      registration.trainingDomain ? `Domaine de formation : ${registration.trainingDomain}` : "",
      "Validez ou refusez l'inscription depuis le back-office → Nos Events.",
    ].filter(Boolean)).catch((err) => console.error("[mail admin event-registration]", err));

    res.status(201).json(registration);
  } catch (err) {
    console.error("[events register]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/categories — public, catalogue complet (branches + formations)
router.get("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const { metier } = req.query as { metier?: string };
    const metierFilter =
      metier === "true" ? { isMetier: true }
      : metier === "false" ? { isMetier: false }
      : {};

    const categories = await prisma.category.findMany({
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
  } catch (err) {
    console.error("[categories]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/sessions — public, sessions ouvertes groupées par branche
// pour les sessions clôturées visibles (récentes), on résout la prochaine
// session de même titre + même branche si elle existe.
router.get("/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, metier } = req.query as { categoryId?: string; metier?: string };

    // metier=true → uniquement les sessions "Formations Métiers" ; metier=false → les autres.
    const metierFilter =
      metier === "true" ? { category: { isMetier: true } }
      : metier === "false" ? { category: { isMetier: false } }
      : {};

    const sessions = await prisma.trainingSession.findMany({
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
      const isOpen =
        OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) && !isFull;

      return { ...s, spotsLeft, isFull, isOpen, nextSessionId: null };
    });

    res.json(withState);
  } catch (err) {
    console.error("[sessions]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/sessions/:id — public, détail d'une session (page de lien d'inscription directe)
router.get("/sessions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const s = await prisma.trainingSession.findUnique({
      where: { id: (req.params["id"] as string) as string },
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
    const isOpen =
      OPEN_SESSION_STATUS.includes(s.status as (typeof OPEN_SESSION_STATUS)[number]) && !isFull;

    res.json({ ...s, spotsLeft, isFull, isOpen });
  } catch (err) {
    console.error("[sessions/:id]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/contact-requests — public, formulaire de contact simple (/inscrire)
router.post("/contact-requests", async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, telephone, email, statut, categoryId, formationName, message } = req.body as {
      nom: string; prenom: string; telephone: string; email: string;
      statut: string; categoryId?: string; formationName?: string; message: string;
    };

    const validStatuts = ["ENTREPRISE", "ENTREPRENEUR", "SALARIE", "ETUDIANT", "AUTRE"];
    if (!nom || !prenom || !telephone || !email || !statut || !message) {
      res.status(400).json({ error: "Tous les champs obligatoires doivent être renseignés" });
      return;
    }
    if (!validStatuts.includes(statut)) {
      res.status(400).json({ error: "Statut invalide" });
      return;
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        nom, prenom, telephone, email,
        statut: statut as "ENTREPRISE" | "ENTREPRENEUR" | "SALARIE" | "ETUDIANT" | "AUTRE",
        categoryId: categoryId || null,
        formationName: formationName || null,
        message,
      },
    });
    res.status(201).json(contactRequest);
  } catch (err) {
    console.error("[contact-requests post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
