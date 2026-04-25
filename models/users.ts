// backend/models/users.ts

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string; // hash bcrypt
  nbWODs?: number;
  xp?: number;
  picture?: string; // URL Cloudinary
  token: string; // uid2(32)
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  nbWODs: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  picture: { type: String },
  token: { type: String, required: true },
});

const User: Model<IUser> =
  (mongoose.models.users as Model<IUser>) ||
  mongoose.model<IUser>("users", userSchema);

export default User;
