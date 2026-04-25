"use strict";
// backend/routes/users.ts
// Router Express pour les routes utilisateurs.
// Identique à users.js du mobile, converti en TypeScript.
//
// POST /users/signup
// POST /users/signin
// POST /users/upload-picture
// GET  /users/me/:userToken
//
// NOTE: multer est importé via require() pour éviter le conflit de types
// entre @types/multer et @types/express (double définition de express-serve-static-core).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uid2_1 = __importDefault(require("uid2"));
const cloudinary_1 = require("cloudinary");
const users_1 = __importDefault(require("../models/users"));
const checkBody_1 = require("../modules/checkBody");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require("multer");
const router = (0, express_1.Router)();
// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
// ── Multer — stockage en mémoire (buffer envoyé à Cloudinary) ─────────────────
// Importé via require pour éviter le conflit @types/multer <-> @types/express
const upload = multer({ storage: multer.memoryStorage() });
const uploadSingle = upload.single("picture");
// ── POST /users/signup ────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
    var _a, _b;
    if (!(0, checkBody_1.checkBody)(req.body, ["username", "email", "password"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const existing = await users_1.default.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
    });
    if (existing) {
        res.json({ result: false, error: "Username or Email already used" });
        return;
    }
    const hash = bcrypt_1.default.hashSync(req.body.password, 10);
    const newUser = new users_1.default({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        nbWODs: 0,
        xp: 0,
        token: (0, uid2_1.default)(32),
    });
    const saved = await newUser.save();
    res.json({
        result: true,
        token: saved.token,
        username: saved.username,
        email: saved.email,
        xp: (_a = saved.xp) !== null && _a !== void 0 ? _a : 0,
        picture: (_b = saved.picture) !== null && _b !== void 0 ? _b : null,
    });
});
// ── POST /users/signin ────────────────────────────────────────────────────────
router.post("/signin", async (req, res) => {
    var _a, _b;
    const { username, email, password } = req.body;
    if (!password || (!username && !email)) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const user = await users_1.default.findOne({ $or: [{ username }, { email }] });
    if (!user || !bcrypt_1.default.compareSync(password, user.password)) {
        res.json({ result: false, error: "User not found or incorrect password" });
        return;
    }
    res.json({
        result: true,
        token: user.token,
        username: user.username,
        email: user.email,
        xp: (_a = user.xp) !== null && _a !== void 0 ? _a : 0,
        picture: (_b = user.picture) !== null && _b !== void 0 ? _b : null,
    });
});
// ── POST /users/upload-picture ────────────────────────────────────────────────
// Reçoit : multipart/form-data { picture (fichier), userToken (string) }
// Upload le buffer directement vers Cloudinary via upload_stream.
//
// uploadSingle est casté en RequestHandler pour contourner le conflit de types
// entre @types/multer et @types/express-serve-static-core.
const handleUpload = async (req, res) => {
    // req.file est injecté par multer (casté en any pour éviter le conflit)
    const file = req.file;
    if (!file) {
        res.json({ result: false, error: "No file received" });
        return;
    }
    const { userToken } = req.body;
    if (!userToken) {
        res.json({ result: false, error: "Missing user token" });
        return;
    }
    const user = await users_1.default.findOne({ token: userToken });
    if (!user) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    // Upload buffer → Cloudinary via upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: "profile_pictures",
            public_id: `user_${user._id}`,
            overwrite: true,
            resource_type: "image",
            transformation: [{ width: 200, height: 200, crop: "fill" }],
        }, (err, result) => {
            if (err || !result)
                reject(err);
            else
                resolve(result);
        });
        stream.end(file.buffer);
    });
    const updated = await users_1.default.findByIdAndUpdate(user._id, { $set: { picture: uploadResult.secure_url } }, { new: true });
    res.json({ result: true, pictureUrl: updated === null || updated === void 0 ? void 0 : updated.picture });
};
router.post("/upload-picture", uploadSingle, handleUpload);
// ── GET /users/me/:userToken ──────────────────────────────────────────────────
router.get("/me/:userToken", async (req, res) => {
    var _a, _b;
    const user = await users_1.default.findOne({ token: req.params.userToken });
    if (!user) {
        res.json({ result: false, error: "User not found" });
        return;
    }
    res.json({
        result: true,
        username: user.username,
        email: user.email,
        xp: (_a = user.xp) !== null && _a !== void 0 ? _a : 0,
        picture: (_b = user.picture) !== null && _b !== void 0 ? _b : null,
    });
});
exports.default = router;
