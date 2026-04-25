"use strict";
// backend/models/wods.ts
// Schéma Mongoose + interface TypeScript — identique à wods.js du mobile.
// timestamps: true → createdAt + updatedAt automatiques.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const wodSchema = new mongoose_1.Schema({
    token: { type: String },
    name: { type: String },
    duration: { type: Number },
    focus: { type: [String] },
    materiel: { type: [String] },
    exercices: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "exercices" }],
    isFavorite: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    distance: { type: String },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "users" },
}, { timestamps: true });
const Wod = mongoose_1.default.models.wod ||
    mongoose_1.default.model("wod", wodSchema);
exports.default = Wod;
