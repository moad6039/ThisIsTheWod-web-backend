"use strict";
// backend/app.ts
// Point d'entrée du serveur Express.
// Backend port 3000 — Frontend Next.js port 3001.
// Toute la logique de connexion MongoDB est dans models/connection.ts.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const connection_1 = require("./models/connection");
const users_1 = __importDefault(require("./routes/users"));
const wods_1 = __importDefault(require("./routes/wods"));
const app = (0, express_1.default)();
// ── Middleware ─────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ── Connexion MongoDB (logs gérés dans models/connection.ts) ───────────────────
(0, connection_1.connectDB)();
// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/users", users_1.default);
app.use("/wods", wods_1.default);
// ── Health check ───────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ status: "ok", app: "THISISTHEWOD API" }));
// ── Démarrage ──────────────────────────────────────────────────────────────────
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
app.listen(PORT, () => console.log(` Muaadh Backend démarré sur http://localhost:${PORT}`));
exports.default = app;
