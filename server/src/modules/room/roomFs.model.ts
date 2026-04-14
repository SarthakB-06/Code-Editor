import mongoose, { Schema, type Model } from "mongoose";

export type RoomFileDb = {
  path: string;
  content: string;
};

export type RoomFsDb = {
  roomId: string;
  version: number;
  folders: string[];
  files: RoomFileDb[];
  updatedAt: Date;
  createdAt: Date;
};

const RoomFileSchema = new Schema<RoomFileDb>(
  {
    path: { type: String, required: true },
    content: { type: String, required: true, default: "" },
  },
  { _id: false },
);

const RoomFsSchema = new Schema<RoomFsDb>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    version: { type: Number, required: true, default: 0 },
    folders: { type: [String], required: true, default: [] },
    files: { type: [RoomFileSchema], required: true, default: [] },
  },
  {
    timestamps: true,
  },
);

export const RoomFsModel: Model<RoomFsDb> =
  (mongoose.models.RoomFs as Model<RoomFsDb>) ??
  mongoose.model<RoomFsDb>("RoomFs", RoomFsSchema);
