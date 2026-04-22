import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "Backend API is running",
    status: "ok",
  });
});

export default router;
