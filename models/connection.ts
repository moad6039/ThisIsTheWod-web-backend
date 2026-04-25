// backend/models/connection.ts
// Gère la connexion MongoDB — tous les logs de connexion sont ici.
// Appelé une seule fois depuis app.ts au démarrage.

import mongoose from "mongoose";

export function connectDB(): void {
  const uri = process.env.MONGODB_URI as string;

  if (!uri) {
    console.error("❌ MONGODB_URI manquant dans .env");
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err: Error) => {
      console.error("❌ MongoDB erreur:", err.message);
      process.exit(1);
    });

  mongoose.connection.on("disconnected", () =>
    console.warn("⚠️  MongoDB déconnecté"),
  );

  mongoose.connection.on("reconnected", () =>
    console.log("🔄 MongoDB reconnecté"),
  );
}
