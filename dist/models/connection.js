"use strict";
// backend/models/connection.ts
// Gère la connexion MongoDB — tous les logs de connexion sont ici.
// Appelé une seule fois depuis app.ts au démarrage.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI manquant dans .env");
        process.exit(1);
    }
    mongoose_1.default
        .connect(uri)
        .then(() => console.log("✅ MongoDB connecté"))
        .catch((err) => {
        console.error("❌ MongoDB erreur:", err.message);
        process.exit(1);
    });
    mongoose_1.default.connection.on("disconnected", () => console.warn("⚠️  MongoDB déconnecté"));
    mongoose_1.default.connection.on("reconnected", () => console.log("🔄 MongoDB reconnecté"));
}
