import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, AuthRequest } from "@/middlewares/auth.middleware";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${safe}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Seuls les fichiers PDF, Word et images sont acceptés"));
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// POST /api/upload — upload un fichier, retourne son URL
router.post(
  "/",
  authenticate,
  (req: AuthRequest, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        res.status(400).json({ error: `Erreur upload : ${err.message}` });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  (req: AuthRequest, res: Response) => {
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
  }
);

// DELETE /api/upload — supprimer un fichier par URL
router.delete("/", authenticate, (req: AuthRequest, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url?.startsWith("/uploads/")) {
    res.status(400).json({ error: "URL invalide" });
    return;
  }
  const filename = url.replace("/uploads/", "");
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
