import { Router, Response } from "express";
import { prisma } from "@/lib/db";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { sendAdminNotificationEmail } from "@/lib/mail";
import { trainerApplicationSchema } from "@/validations/content.schema";

const router = Router();

// POST /api/trainer-applications — candidature « Devenir collaborateur » (public, tâche 8)
router.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = trainerApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const { firstName, lastName, email, phone, speciality, message, cvUrl, fileUrls } = parsed.data;

    const application = await prisma.trainerApplication.create({
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

    void sendAdminNotificationEmail("Nouvelle candidature collaborateur", [
      `${firstName} ${lastName} (${email}) souhaite devenir collaborateur.`,
      speciality ? `Spécialité : ${speciality}` : "",
      phone ? `Téléphone : ${phone}` : "",
      "Consultez la candidature depuis le back-office → Candidatures.",
    ].filter(Boolean)).catch((err) => console.error("[mail admin trainer-application]", err));

    res.status(201).json(application);
  } catch (err) {
    console.error("[trainer-applications post]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
