"use strict";
// backend/routes/wods.ts
// Router Express pour les routes WOD.
// Identique à wods.js du mobile, converti en TypeScript.
//
// POST  /wods/generate
// POST  /wods/save
// GET   /wods/history/:userToken
// GET   /wods/favorites/:userToken
// PATCH /wods/:token/favorite
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uid2_1 = __importDefault(require("uid2"));
const wods_1 = __importDefault(require("../models/wods"));
const exercices_1 = __importDefault(require("../models/exercices"));
const users_1 = __importDefault(require("../models/users"));
const router = (0, express_1.Router)();
// ── POST /wods/generate ───────────────────────────────────────────────────────
// Body : { duration, focus[], materiel[] }
// 1 exercice toutes les 5 min (300s). Génère 3 WODs distincts.
router.post("/generate", async (req, res) => {
    var _a, _b;
    const body = req.body;
    let duration = Number(body.duration);
    if (![1200, 2400, 3600].includes(duration))
        duration = 1200;
    const filter = {};
    if ((_a = body.focus) === null || _a === void 0 ? void 0 : _a.length)
        filter.focus = { $in: body.focus };
    if ((_b = body.materiel) === null || _b === void 0 ? void 0 : _b.length)
        filter.$or = [
            { materiel: { $in: body.materiel } },
            { materiel: { $size: 0 } },
        ];
    else
        filter.materiel = { $size: 0 };
    const data = await exercices_1.default.find(filter);
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
    while (pool.length < nbExercices)
        pool = [...pool, ...data];
    const wods = Array.from({ length: 3 }, () => ({
        token: (0, uid2_1.default)(32),
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
router.post("/save", async (req, res) => {
    const body = req.body;
    if (!body.token || !body.name || !body.duration) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const user = await users_1.default.findOne({ token: body.owner });
    if (!user) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    const saved = await wods_1.default.findOneAndUpdate({ token: body.token }, {
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
    }, { upsert: true, new: true, runValidators: true }).populate("exercices");
    res.json({ result: true, savedWodToken: saved });
});
// ── GET /wods/history/:userToken ──────────────────────────────────────────────
// WODs isCompleted: true, triés du plus récent au plus ancien.
router.get("/history/:userToken", async (req, res) => {
    const user = await users_1.default.findOne({ token: req.params.userToken });
    if (!user) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    const history = await wods_1.default.find({ owner: user._id, isCompleted: true })
        .populate("exercices")
        .sort({ updatedAt: -1 });
    res.json({ result: true, history });
});
// ── GET /wods/favorites/:userToken ────────────────────────────────────────────
router.get("/favorites/:userToken", async (req, res) => {
    const user = await users_1.default.findOne({ token: req.params.userToken });
    if (!user) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    const favoritesWOD = await wods_1.default.find({
        isFavorite: true,
        owner: user._id,
    }).populate("exercices");
    res.json({ result: true, favoritesWOD });
});
// ── PATCH /wods/:token/favorite ───────────────────────────────────────────────
// isCompleted → retire le favori seulement (garde en historique)
// sinon       → supprime le WOD
router.patch("/:token/favorite", async (req, res) => {
    const wod = await wods_1.default.findOne({ token: req.params.token });
    if (!wod) {
        res.json({ result: false, error: "WOD not found" });
        return;
    }
    if (wod.isCompleted) {
        await wods_1.default.updateOne({ token: req.params.token }, { isFavorite: false });
        res.json({ result: true, action: "unfavorited" });
    }
    else {
        await wods_1.default.deleteOne({ token: req.params.token });
        res.json({ result: true, action: "deleted" });
    }
});
exports.default = router;
