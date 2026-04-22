import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.CONNECTION_STRING as string;

if (!connectionString) {
  throw new Error("CONNECTION_STRING is not defined in .env");
}

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected to MongoDB"))
  .catch((error: Error) => console.error(error));
