// backend/models/wods.ts
// timestamps: true → createdAt + updatedAt automatiques.

import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IWod extends Document {
  token: string;
  name?: string;
  duration?: number;
  focus?: string[];
  materiel?: string[];
  exercices: Types.ObjectId[];
  isFavorite: boolean;
  isCompleted: boolean;
  distance?: string;
  owner?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const wodSchema = new Schema<IWod>(
  {
    token: { type: String },
    name: { type: String },
    duration: { type: Number },
    focus: { type: [String] },
    materiel: { type: [String] },
    exercices: [{ type: Schema.Types.ObjectId, ref: "exercices" }],
    isFavorite: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    distance: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

const Wod: Model<IWod> =
  (mongoose.models.wod as Model<IWod>) ||
  mongoose.model<IWod>("wod", wodSchema);

export default Wod;
