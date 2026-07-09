"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const enrollments_routes_1 = __importDefault(require("./routes/enrollments.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const trainers_routes_1 = __importDefault(require("./routes/trainers.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const catalog_routes_1 = __importDefault(require("./routes/catalog.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// ─── Middlewares globaux ──────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3000",
];
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin))
            cb(null, true);
        else
            cb(new Error("CORS bloqué"));
    },
    credentials: true,
}));
app.use(express_1.default.json());
// ─── Fichiers statiques (CV, fiches techniques) ──────────────────────────────
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", auth_routes_1.default);
app.use("/api/companies", company_routes_1.default);
app.use("/api/enrollments", enrollments_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/trainers", trainers_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api", catalog_routes_1.default);
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
