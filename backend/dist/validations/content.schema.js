"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentSchema = exports.trainerApplicationSchema = exports.partnerSchema = void 0;
const zod_1 = require("zod");
// ─── Partenaires / avantages (tâche 3) ───────────────────────────────────────
exports.partnerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Nom du partenaire requis").trim(),
    description: zod_1.z.string().optional(),
    discountRate: zod_1.z.string().optional(),
    contact: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ─── Candidature « Devenir collaborateur » (tâche 8) ─────────────────────────
exports.trainerApplicationSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "Prénom requis").trim(),
    lastName: zod_1.z.string().min(2, "Nom requis").trim(),
    email: zod_1.z.string().email("Email invalide").trim().toLowerCase(),
    phone: zod_1.z.string().optional(),
    speciality: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
    cvUrl: zod_1.z.string().optional(),
    // fichiers additionnels (fiches techniques) : URLs déjà uploadées via FileUpload
    fileUrls: zod_1.z.array(zod_1.z.string()).optional(),
});
// ─── Documents (reçu / dossier — tâches 4 & 5) ───────────────────────────────
exports.documentSchema = zod_1.z.object({
    type: zod_1.z.enum(["RECU", "DOSSIER_ADMIN"]),
    fileUrl: zod_1.z.string().min(1, "Fichier requis"),
    originalName: zod_1.z.string().optional(),
    enrollmentId: zod_1.z.string().optional(),
});
