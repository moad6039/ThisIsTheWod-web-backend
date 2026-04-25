// backend/routes/wods.ts
// Router Express pour les routes WOD.
//
// POST  /wods/generate
// POST  /wods/save
// GET   /wods/history/:userToken
// GET   /wods/favorites/:userToken
// PATCH /wods/:token/favorite

import { Router, Request, Response } from "express";
import uid2 from "uid2";
import Wod from "../models/wods";
import Exercice from "../models/exercices";
import User from "../models/users";

const router = Router();

// ── POST /wods/generate ───────────────────────────────────────────────────────
// Body : { duration, focus[], materiel[] }
// 1 exercice toutes les 5 min (300s). Génère 3 WODs distincts.
router.post("/generate", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    duration?: number;
    focus?: string[];
    materiel?: string[];
  };

  let duration = Number(body.duration);
  if (![1200, 2400, 3600].includes(duration)) duration = 1200;

  const filter: Record<string, unknown> = {};
  if (body.focus?.length) filter.focus = { $in: body.focus };
  if (body.materiel?.length)
    filter.$or = [
      { materiel: { $in: body.materiel } },
      { materiel: { $size: 0 } },
    ];
  else filter.materiel = { $size: 0 };

  const data = await Exercice.find(filter);
  if (!data.length) {
    res.json({
      result: false,
      error: "No exercises found matching these criteria.",
    });
    return;
  }

  const nbExercices = duration / 300;
  const time = duration / 60;

  // Recycle la liste si pas assez d'exos filtrés
  let pool = [...data];
  while (pool.length < nbExercices) pool = [...pool, ...data];

  const wods = Array.from({ length: 3 }, () => ({
    token: uid2(32),
    name: `WOD ${time} min`,
    duration,
    focus: body.focus,
    materiel: body.materiel,
    exercices: [...pool].sort(() => Math.random() - 0.5).slice(0, nbExercices),
    isFavorite: false,
  }));

  res.json({ result: true, wods });
});

// ── POST /wods/save ───────────────────────────────────────────────────────────
// upsert : crée si token inexistant, met à jour sinon.
// isCompleted: true → historique  |  isFavorite: true → favoris
router.post("/save", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    token?: string;
    name?: string;
    duration?: number;
    focus?: string[];
    materiel?: string[];
    exercices?: string[];
    isFavorite?: boolean;
    isCompleted?: boolean;
    owner?: string;
  };

  if (!body.token || !body.name || !body.duration) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const user = await User.findOne({ token: body.owner });
  if (!user) {
    res.json({ result: false, error: "User not found" });
    return;
  }

  const saved = await Wod.findOneAndUpdate(
    { token: body.token },
    {
      $set: {
        token: body.token,
        name: body.name,
        duration: body.duration,
        focus: body.focus,
        materiel: body.materiel,
        exercices: body.exercices,
        isFavorite: body.isFavorite,
        isCompleted: body.isCompleted,
        owner: user._id,
      },
    },
    { upsert: true, new: true, runValidators: true },
  ).populate("exercices");

  res.json({ result: true, savedWodToken: saved });
});

// ── GET /wods/history/:userToken ──────────────────────────────────────────────
// WODs isCompleted: true, triés du plus récent au plus ancien.
router.get(
  "/history/:userToken",
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ token: req.params.userToken });
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    const history = await Wod.find({ owner: user._id, isCompleted: true })
      .populate("exercices")
      .sort({ updatedAt: -1 });

    res.json({ result: true, history });
  },
);

// ── GET /wods/favorites/:userToken ────────────────────────────────────────────
router.get(
  "/favorites/:userToken",
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ token: req.params.userToken });
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    const favoritesWOD = await Wod.find({
      isFavorite: true,
      owner: user._id,
    }).populate("exercices");

    res.json({ result: true, favoritesWOD });
  },
);

// ── PATCH /wods/:token/favorite ───────────────────────────────────────────────
// isCompleted → retire le favori seulement (garde en historique)
// sinon       → supprime le WOD
router.patch(
  "/:token/favorite",
  async (req: Request, res: Response): Promise<void> => {
    const wod = await Wod.findOne({ token: req.params.token });
    if (!wod) {
      res.json({ result: false, error: "WOD not found" });
      return;
    }

    if (wod.isCompleted) {
      await Wod.updateOne({ token: req.params.token }, { isFavorite: false });
      res.json({ result: true, action: "unfavorited" });
    } else {
      await Wod.deleteOne({ token: req.params.token });
      res.json({ result: true, action: "deleted" });
    }
  },
);

export default router;
