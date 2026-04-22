import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  nbWODs?: number;
  xp?: number;
  picture?: string;
  token: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email:    { type: String, required: true },
  password: { type: String, required: true },
  nbWODs:   { type: Number, default: 0 },
  xp:       { type: Number, default: 0 },
  picture:  { type: String },
  token:    { type: String, required: true },
});

const User: Model<IUser> = mongoose.model<IUser>("users", userSchema);

export default User;