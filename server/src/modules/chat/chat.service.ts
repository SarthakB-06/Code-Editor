import { ChatMessage } from "./chat.model.js";

export const saveMessage = async (params: {
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
}) => {
  const msg = new ChatMessage(params);
  await msg.save();
  return {
    id: msg._id.toString(),
    roomId: msg.roomId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
  };
};

export const getRoomHistory = async (roomId: string, limit = 50) => {
  const history = await ChatMessage.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  // Reverse to send oldest first up to 'limit' messages
  return history.reverse().map((msg) => ({
    id: msg._id.toString(),
    roomId: msg.roomId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
  }));
};
