import mongoose, { Schema, type Model } from "mongoose";

export type DocumentDb = {
  roomId: string;
  code: string;
  version: number;
  updatedAt: Date;
  createdAt: Date;
};

const DocumentSchema = new Schema<DocumentDb>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, default: "" },
    version: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

export const DocumentModel: Model<DocumentDb> =
  (mongoose.models.Document as Model<DocumentDb>) ??
  mongoose.model<DocumentDb>("Document", DocumentSchema);
