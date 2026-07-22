"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const unique = `${Date.now()}-${safe}`;
        cb(null, unique);
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error("Seuls les fichiers PDF, Word et images sont acceptés"));
    },
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});
const trainerApplicationUpload = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = [".pdf", ".doc", ".docx"];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error("Seuls les fichiers PDF et Word sont acceptÃ©s"));
    },
    limits: { fileSize: 15 * 1024 * 1024 },
});
// Endpoint public limitÃ© aux documents joints aux candidatures formateur.
router.post("/trainer-application", (req, res, next) => {
    trainerApplicationUpload.single("file")(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            res.status(400).json({ error: `Erreur upload : ${err.message}` });
            return;
        }
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        next();
    });
}, (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "Aucun fichier reÃ§u" });
        return;
    }
    res.json({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
    });
});
// POST /api/upload — upload un fichier, retourne son URL
router.post("/", auth_middleware_1.authenticate, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            res.status(400).json({ error: `Erreur upload : ${err.message}` });
            return;
        }
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        next();
    });
}, (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "Aucun fichier reçu" });
        return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
    });
});
// DELETE /api/upload — supprimer un fichier par URL
router.delete("/", auth_middleware_1.authenticate, (req, res) => {
    const { url } = req.body;
    if (!url?.startsWith("/uploads/")) {
        res.status(400).json({ error: "URL invalide" });
        return;
    }
    const filename = url.replace("/uploads/", "");
    const filePath = path_1.default.join(uploadDir, filename);
    if (fs_1.default.existsSync(filePath))
        fs_1.default.unlinkSync(filePath);
    res.json({ success: true });
});
exports.default = router;
