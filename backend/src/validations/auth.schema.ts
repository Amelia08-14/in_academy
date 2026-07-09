import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  firstName: z.string().min(2, "Prénom requis").trim(),
  lastName: z.string().min(2, "Nom requis").trim(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const companyRegisterSchema = z.object({
  raisonSociale: z.string().min(2, "Raison sociale requise").trim(),
  nif: z.string().optional(),
  rc: z.string().optional(),
  address: z.string().optional(),
  wilaya: z.string().min(1, "Wilaya requise"),
  commune: z.string().min(1, "Commune requise").trim(),
  phone: z.string().min(1, "Téléphone requis"),
  activityCategoryId: z.string().optional(),
  activityOther: z.string().optional(),
  adminEmail: z.string().email("Email invalide").trim().toLowerCase(),
  adminPassword: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  adminFirstName: z.string().min(2, "Prénom requis").trim(),
  adminLastName: z.string().min(2, "Nom requis").trim(),
}).refine((d) => d.activityCategoryId || d.activityOther, {
  message: "Activité professionnelle requise",
  path: ["activityCategoryId"],
});
