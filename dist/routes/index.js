"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.status(200).json({
        message: "Backend API is running",
        status: "ok",
    });
});
exports.default = router;
