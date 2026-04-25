// backend/routes/users.ts
// Router Express pour les routes utilisateurs.
//
// POST /users/signup
// POST /users/signin
// POST /users/upload-picture
// GET  /users/me/:userToken
//
// NOTE: multer est importé via require() pour éviter le conflit de types
// entre @types/multer et @types/express (double définition de express-serve-static-core).

import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import bcrypt from "bcrypt";
import uid2 from "uid2";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/users";
import { checkBody } from "../modules/checkBody";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require("multer");

// Type local pour le fichier multer (évite l'import @types/multer qui crée le conflit)
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const router = Router();

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Multer — stockage en mémoire (buffer envoyé à Cloudinary) ─────────────────
// Importé via require pour éviter le conflit @types/multer <-> @types/express
const upload = multer({ storage: multer.memoryStorage() });
const uploadSingle = upload.single("picture") as RequestHandler;

// ── POST /users/signup ────────────────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const existing = await User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  });
  if (existing) {
    res.json({ result: false, error: "Username or Email already used" });
    return;
  }

  const hash = bcrypt.hashSync(req.body.password as string, 10);
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: hash,
    nbWODs: 0,
    xp: 0,
    token: uid2(32),
  });

  const saved = await newUser.save();
  res.json({
    result: true,
    token: saved.token,
    username: saved.username,
    email: saved.email,
    xp: saved.xp ?? 0,
    picture: saved.picture ?? null,
  });
});

// ── POST /users/signin ────────────────────────────────────────────────────────
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!password || (!username && !email)) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.json({ result: false, error: "User not found or incorrect password" });
    return;
  }

  res.json({
    result: true,
    token: user.token,
    username: user.username,
    email: user.email,
    xp: user.xp ?? 0,
    picture: user.picture ?? null,
  });
});

// ── POST /users/upload-picture ────────────────────────────────────────────────
// Reçoit : multipart/form-data { picture (fichier), userToken (string) }
// Upload le buffer directement vers Cloudinary via upload_stream.
//
// uploadSingle est casté en RequestHandler pour contourner le conflit de types
// entre @types/multer et @types/express-serve-static-core.
const handleUpload = async (req: Request, res: Response): Promise<void> => {
  // req.file est injecté par multer (casté en any pour éviter le conflit)
  const file = (req as any).file as MulterFile | undefined;

  if (!file) {
    res.json({ result: false, error: "No file received" });
    return;
  }

  const { userToken } = req.body as { userToken?: string };
  if (!userToken) {
    res.json({ result: false, error: "Missing user token" });
    return;
  }

  const user = await User.findOne({ token: userToken });
  if (!user) {
    res.json({ result: false, error: "User not found" });
    return;
  }

  // Upload buffer → Cloudinary via upload_stream
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_pictures",
          public_id: `user_${user._id}`,
          overwrite: true,
          resource_type: "image",
          transformation: [{ width: 200, height: 200, crop: "fill" }],
        },
        (err, result) => {
          if (err || !result) reject(err);
          else resolve(result as { secure_url: string });
        },
      );
      stream.end(file.buffer);
    },
  );

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: { picture: uploadResult.secure_url } },
    { new: true },
  );

  res.json({ result: true, pictureUrl: updated?.picture });
};

router.post("/upload-picture", uploadSingle, handleUpload);

// ── GET /users/me/:userToken ──────────────────────────────────────────────────
router.get(
  "/me/:userToken",
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ token: req.params.userToken });
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    res.json({
      result: true,
      username: user.username,
      email: user.email,
      xp: user.xp ?? 0,
      picture: user.picture ?? null,
    });
  },
);

export default router;
