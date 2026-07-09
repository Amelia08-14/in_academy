"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@/lib/db");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const trainerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    displayName: zod_1.z.string().min(2),
    email: zod_1.z.email().optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    speciality: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    cvUrl: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// GET /api/trainers — public (liste pour catalogue)
router.get("/", async (_req, res) => {
    const trainers = await db_1.prisma.trainer.findMany({
        where: { isActive: true },
        orderBy: { lastName: "asc" },
        include: {
            formations: {
                include: { formation: { select: { id: true, title: true, slug: true } } },
            },
        },
    });
    res.json(trainers);
});
// GET /api/trainers/:id — public
router.get("/:id", async (req, res) => {
    const trainer = await db_1.prisma.trainer.findUnique({
        where: { id: req.params["id"] },
        include: {
            formations: {
                include: { formation: { include: { category: true } } },
            },
        },
    });
    if (!trainer) {
        res.status(404).json({ error: "Formateur introuvable" });
        return;
    }
    res.json(trainer);
});
// ── Routes admin ──────────────────────────────────────────────────────────────
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("SUPER_ADMIN", "ADMIN", "MANAGER"));
// POST /api/trainers — créer un formateur
router.post("/", async (req, res) => {
    const parsed = trainerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = parsed.data;
    const trainer = await db_1.prisma.trainer.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName,
            email: data.email || null,
            phone: data.phone || null,
            speciality: data.speciality || null,
            bio: data.bio || null,
            cvUrl: data.cvUrl || null,
            isActive: data.isActive ?? true,
        },
    });
    res.status(201).json(trainer);
});
// PATCH /api/trainers/:id — modifier
router.patch("/:id", async (req, res) => {
    const parsed = trainerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const trainer = await db_1.prisma.trainer.update({
        where: { id: req.params["id"] },
        data: parsed.data,
    });
    res.json(trainer);
});
// DELETE /api/trainers/:id — supprimer (soft: désactiver)
router.delete("/:id", async (req, res) => {
    await db_1.prisma.trainer.update({
        where: { id: req.params["id"] },
        data: { isActive: false },
    });
    res.json({ success: true });
});
// PATCH /api/trainers/:id/formations — lier/délier des formations
router.patch("/:id/formations", async (req, res) => {
    const { formationIds } = req.body;
    const trainerId = req.params["id"];
    // Supprimer les anciennes liaisons
    await db_1.prisma.formationTrainer.deleteMany({ where: { trainerId } });
    // Recréer les nouvelles
    if (formationIds?.length) {
        await db_1.prisma.formationTrainer.createMany({
            data: formationIds.map((formationId, i) => ({
                trainerId,
                formationId,
                isPrimary: i === 0,
            })),
            skipDuplicates: true,
        });
    }
    res.json({ success: true });
});
exports.default = router;
