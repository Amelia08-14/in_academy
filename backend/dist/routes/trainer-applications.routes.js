"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const mail_1 = require("../lib/mail");
const content_schema_1 = require("../validations/content.schema");
const router = (0, express_1.Router)();
// POST /api/trainer-applications — candidature « Devenir collaborateur » (public, tâche 8)
router.post("/", async (req, res) => {
    const parsed = content_schema_1.trainerApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const { firstName, lastName, email, phone, speciality, message, cvUrl, fileUrls } = parsed.data;
        const application = await db_1.prisma.trainerApplication.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone ?? null,
                speciality: speciality ?? null,
                message: message ?? null,
                cvUrl: cvUrl ?? null,
                files: fileUrls && fileUrls.length > 0
                    ? { create: fileUrls.map((url) => ({ fileUrl: url })) }
                    : undefined,
            },
            include: { files: true },
        });
        void (0, mail_1.sendAdminNotificationEmail)("Nouvelle candidature collaborateur", [
            `${firstName} ${lastName} (${email}) souhaite devenir collaborateur.`,
            speciality ? `Spécialité : ${speciality}` : "",
            phone ? `Téléphone : ${phone}` : "",
            "Consultez la candidature depuis le back-office → Candidatures.",
        ].filter(Boolean)).catch((err) => console.error("[mail admin trainer-application]", err));
        res.status(201).json(application);
    }
    catch (err) {
        console.error("[trainer-applications post]", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
