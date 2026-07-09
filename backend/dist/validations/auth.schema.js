"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyRegisterSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email invalide").trim().toLowerCase(),
    password: zod_1.z.string().min(1, "Mot de passe requis"),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email invalide").trim().toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, "Minimum 8 caractères")
        .regex(/[A-Z]/, "Au moins une majuscule")
        .regex(/[0-9]/, "Au moins un chiffre"),
    firstName: zod_1.z.string().min(2, "Prénom requis").trim(),
    lastName: zod_1.z.string().min(2, "Nom requis").trim(),
    phone: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
});
exports.companyRegisterSchema = zod_1.z.object({
    raisonSociale: zod_1.z.string().min(2, "Raison sociale requise").trim(),
    nif: zod_1.z.string().optional(),
    rc: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    wilaya: zod_1.z.string().min(1, "Wilaya requise"),
    commune: zod_1.z.string().min(1, "Commune requise").trim(),
    phone: zod_1.z.string().min(1, "Téléphone requis"),
    activityCategoryId: zod_1.z.string().optional(),
    activityOther: zod_1.z.string().optional(),
    adminEmail: zod_1.z.string().email("Email invalide").trim().toLowerCase(),
    adminPassword: zod_1.z
        .string()
        .min(8, "Minimum 8 caractères")
        .regex(/[A-Z]/, "Au moins une majuscule")
        .regex(/[0-9]/, "Au moins un chiffre"),
    adminFirstName: zod_1.z.string().min(2, "Prénom requis").trim(),
    adminLastName: zod_1.z.string().min(2, "Nom requis").trim(),
}).refine((d) => d.activityCategoryId || d.activityOther, {
    message: "Activité professionnelle requise",
    path: ["activityCategoryId"],
});
