import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExercice extends Document {
  name: string;
  category?: string;
  rep?: number;
  focus?: string[];
  materiel?: string[];
  duration?: number;
  recup?: number;
  difficulty?: string;
  xp?: number;
  rx?: {
    homme?: string;
    femme?: string;
  };
  description?: string;
  image?: string; // URL Cloudinary
  distance?: string;
}

const exerciceSchema = new Schema<IExercice>({
  name:        { type: String, required: true },
  category:    { type: String },
  rep:         { type: Number },
  focus:       { type: [String] },
  materiel:    { type: [String] },
  duration:    { type: Number },
  recup:       { type: Number },
  difficulty:  { type: String },
  xp:          { type: Number },
  rx: {
    homme: { type: String },
    femme: { type: String },
  },
  description: { type: String },
  image:       { type: String },
  distance:    { type: String },
});

const Exercice: Model<IExercice> = mongoose.model<IExercice>("exercices", exerciceSchema);

export default Exercice;