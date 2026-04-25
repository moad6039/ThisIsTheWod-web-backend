// backend/app.ts
// Point d'entrée du serveur Express.
// Backend port 3000 — Frontend Next.js port 3001.
// Toute la logique de connexion MongoDB est dans models/connection.ts.

import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDB } from "./models/connection";
import usersRouter from "./routes/users";
import wodsRouter from "./routes/wods";

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Connexion MongoDB (logs gérés dans models/connection.ts) ───────────────────
connectDB();

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/users", usersRouter);
app.use("/wods", wodsRouter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", app: "THISISTHEWOD API" }),
);

// ── Démarrage ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () =>
  console.log(` Muaadh Backend démarré sur http://localhost:${PORT}`),
);

export default app;
