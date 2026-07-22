import { z } from "zod";

// ─── Partenaires / avantages (tâche 3) ───────────────────────────────────────
export const partnerSchema = z.object({
  name: z.string().min(2, "Nom du partenaire requis").trim(),
  description: z.string().optional(),
  discountRate: z.string().optional(),
  contact: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Candidature « Devenir collaborateur » (tâche 8) ─────────────────────────
export const trainerApplicationSchema = z.object({
  firstName: z.string().min(2, "Prénom requis").trim(),
  lastName: z.string().min(2, "Nom requis").trim(),
  email: z.string().email("Email invalide").trim().toLowerCase(),
  phone: z.string().optional(),
  speciality: z.string().optional(),
  message: z.string().optional(),
  cvUrl: z.string().optional(),
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
