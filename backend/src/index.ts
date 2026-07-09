import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "@/routes/auth.routes";
import companyRoutes from "@/routes/company.routes";
import enrollmentRoutes from "@/routes/enrollments.routes";
import adminRoutes from "@/routes/admin.routes";
import trainerRoutes from "@/routes/trainers.routes";
import uploadRoutes from "@/routes/upload.routes";
import catalogRoutes from "@/routes/catalog.routes";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Middlewares globaux ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL ?? "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("CORS bloqué"));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Fichiers statiques (CV, fiches techniques) ──────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", catalogRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.listen(PORT, () => {
  console.log(`Backend IN ACADEMY démarré sur http://localhost:${PORT}`);
});
