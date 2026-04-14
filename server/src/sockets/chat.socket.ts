import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS, type ChatSendPayload, type User } from "./events.js";
import { getRoomHistory, saveMessage } from "../modules/chat/chat.service.js";

type SocketData = {
  user?: User;
};

export const registerChatHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const s = socket as Socket & { data: SocketData };

    const emitError = (message: string) => {
      socket.emit("error", { message });
    };

    const onChatSend = async (payload: ChatSendPayload) => {
      const user = s.data.user;
      if (!user) {
        emitError("UNAUTHORIZED");
        return;
      }

      const { roomId, text } = payload;
      if (!roomId || !text.trim()) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      try {
        const message = await saveMessage({
          roomId,
          senderId: user.id,
          senderName: user.name,
          text: text.trim(),
        });

        io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
      } catch (err) {
        console.error("[Chat Send] Error:", err);
        emitError("Failed to save message");
      }
    };

    const fetchHistoryAndEmit = async (roomId: string) => {
      try {
        const history = await getRoomHistory(roomId);
        socket.emit(SOCKET_EVENTS.CHAT_HISTORY, { roomId, messages: history });
      } catch (err) {
        console.error("[Chat History] Error:", err);
        emitError("Failed to fetch chat history");
      }
    };

    // We can listen to a specific room history request if the client asks,
    // or just fetch it on join. For simplicity, we attach it here so `room.socket`
    // or the client can trigger it upon joining.
    socket.on("get-chat-history", ({ roomId }: { roomId: string }) => {
      if (roomId) fetchHistoryAndEmit(roomId);
    });

    socket.on(SOCKET_EVENTS.CHAT_SEND, onChatSend);
  };

  io.on("connection", onConnection);
};
