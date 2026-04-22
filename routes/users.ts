import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import uid2 from "uid2";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";

import "../models/connection";
import User from "../models/users";
import { checkBody } from "../modules/checkBody";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION CLOUDINARY
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

const isCloudinaryConfigured = (): boolean =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET),
  );

// Multer — stockage en mémoire, stream direct vers Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────────────────────
// POST /users/signup
// ─────────────────────────────────────────────────────────────────────────────
router.post("/signup", (req: Request, res: Response) => {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  }).then((data) => {
    if (data !== null) {
      res.json({ result: false, error: "Username or Email already used" });
      return;
    }

    const hash = bcrypt.hashSync(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      email:    req.body.email,
      password: hash,
      token:    uid2(32),
      nbWODs:   req.body.nbWODs ?? 0,
      xp:       req.body.xp ?? 0,
      picture:  req.body.picture ?? null,
    });

    newUser.save().then((saved) => {
      res.json({
        result:   true,
        token:    saved.token,
        username: saved.username,
        email:    saved.email,
        xp:       saved.xp,
        picture:  saved.picture ?? null,
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /users/signin
// ─────────────────────────────────────────────────────────────────────────────
router.post("/signin", (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!password || (!username && !email)) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ $or: [{ username }, { email }] }).then((data) => {
    if (data && bcrypt.compareSync(password, data.password)) {
      res.json({
        result:   true,
        token:    data.token,
        username: data.username,
        email:    data.email,
        xp:       data.xp,
        picture:  data.picture ?? null,
      });
    } else {
      res.json({ result: false, error: "User not found or incorrect password" });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /users/upload-picture
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/upload-picture",
  upload.single("picture"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ result: false, error: "No file received" });
        return;
      }
      if (!req.body.userToken) {
        res.status(400).json({ result: false, error: "Missing user token" });
        return;
      }
      if (!isCloudinaryConfigured()) {
        res.status(500).json({ result: false, error: "Cloudinary is not configured on the server" });
        return;
      }

      const user = await User.findOne({ token: req.body.userToken });
      if (!user) {
        res.status(404).json({ result: false, error: "User not found" });
        return;
      }

      // Upload via stream (buffer → Cloudinary, pas de base64)
      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder:          "profile_pictures",
              public_id:       `user_${user._id}`,
              overwrite:       true,
              resource_type:   "image",
              transformation: [{ width: 200, height: 200, crop: "fill" }],
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result as { secure_url: string });
            },
          );
          Readable.from(req.file!.buffer).pipe(uploadStream);
        },
      );

      const updated = await User.findByIdAndUpdate(
        user._id,
        { $set: { picture: uploadResult.secure_url } },
        { new: true, upsert: false },
      );

      if (!updated) {
        res.status(404).json({ result: false, error: "User not found during picture update" });
        return;
      }

      res.json({ result: true, pictureUrl: updated.picture });
    } catch (error) {
      console.error("Upload picture error:", error);
      res.status(500).json({
        result: false,
        error: error instanceof Error ? error.message : "Cloudinary upload failed",
      });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/me/:userToken
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me/:userToken", (req: Request, res: Response) => {
  User.findOne({ token: req.params.userToken }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    res.json({
      result:   true,
      username: user.username,
      email:    user.email,
      xp:       user.xp,
      picture:  user.picture ?? null,
    });
  });
});

export default router;