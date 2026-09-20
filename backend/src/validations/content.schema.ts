import { z } from "zod";

// ─── Partenaires / avantages (tâche 3) ───────────────────────────────────────
export const partnerSchema = z.object({
  name: z.string().min(2, "Nom du partenaire requis").trim(),
  description: z.string().optional(),
  discountRate: z.string().optional(),
  contact: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Événements ("Nos Events") ────────────────────────────────────────────────
export const eventSchema = z.object({
  title: z.string().min(2, "Titre requis").trim(),
  eventDate: z.string().min(1, "Date requise"),
  location: z.string().optional(),
  summary: z.string().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  isPublished: z.boolean().optional(),
  photoUrls: z.array(z.string()).optional(),
});

// Inscription à un événement — champs saisis à la main pour un invité, ou
// complétés/écrasés côté serveur depuis le compte si l'inscrit est connecté.
// Tout est obligatoire ; le nom d'entreprise n'est requis que pour un profil "Entreprise".
export const eventRegistrationSchema = z
  .object({
    fullName: z.string().min(2, "Nom requis").trim(),
    email: z.string().email("Email invalide").trim().toLowerCase(),
    phone: z.string().min(1, "Téléphone requis").trim(),
    registrantType: z.enum(["INDIVIDUAL", "COMPANY"]),
    companyName: z.string().optional(),
    jobTitle: z.string().min(1, "Fonction requise").trim(),
    activityDomain: z.string().min(1, "Domaine d'activité requis").trim(),
  })
  .refine((d) => d.registrantType !== "COMPANY" || Boolean(d.companyName?.trim()), {
    message: "Nom de l'entreprise requis",
    path: ["companyName"],
  });

// Sous-ensemble toujours accepté du corps de la requête même quand l'inscrit est
// connecté : nom/email viennent du compte, mais le téléphone reste requis (celui
// du compte sert de valeur par défaut, écrasable si le profil n'en a pas) et
// type de profil / entreprise / fonction / domaine d'activité restent propres
// à cette inscription (jamais déduits du compte).
export const eventRegistrationExtraSchema = z
  .object({
    phone: z.string().trim().optional(),
    registrantType: z.enum(["INDIVIDUAL", "COMPANY"]),
    companyName: z.string().optional(),
    jobTitle: z.string().min(1, "Fonction requise").trim(),
    activityDomain: z.string().min(1, "Domaine d'activité requis").trim(),
  })
  .refine((d) => d.registrantType !== "COMPANY" || Boolean(d.companyName?.trim()), {
    message: "Nom de l'entreprise requis",
    path: ["companyName"],
  });

// ─── Inscription directe à une session métier (sans compte) ──────────────────
export const sessionRegistrationSchema = z.object({
  lastName: z.string().min(2, "Nom requis").trim(),
  firstName: z.string().min(2, "Prénom requis").trim(),
  email: z.string().email("Email invalide").trim().toLowerCase(),
  phone: z.string().min(6, "Téléphone requis").trim(),
  educationLevel: z.string().min(1, "Niveau d'étude requis").trim(),
});

// ─── Candidature « Devenir collaborateur » (tâche 8) ─────────────────────────
export const trainerApplicationSchema = z.object({
  firstName: z.string().min(2, "Prénom requis").trim(),
  lastName: z.string().min(2, "Nom requis").trim(),
  email: z.string().email("Email invalide").trim().toLowerCase(),
  phone: z.string().optional(),
  speciality: z.string().optional(),
  message: z.string().optional(),
  cvUrl: z.string().min(1, "CV requis"),
  // fichiers additionnels (fiches techniques) : URLs déjà uploadées via FileUpload
  fileUrls: z.array(z.string()).optional(),
});

// ─── Documents (reçu / dossier — tâches 4 & 5) ───────────────────────────────
export const documentSchema = z.object({
  type: z.enum(["RECU", "DOSSIER_ADMIN"]),
  fileUrl: z.string().min(1, "Fichier requis"),
  originalName: z.string().optional(),
  enrollmentId: z.string().optional(),
});
