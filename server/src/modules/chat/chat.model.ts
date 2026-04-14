import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

// Optimize querying message history by room
chatMessageSchema.index({ roomId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessage>(
  "ChatMessage",
  chatMessageSchema,
);
