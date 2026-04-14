import type { Server, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  type ActiveFilePayload,
  type CursorMovePayload,
  type User,
} from "./events.js";

type SocketData = {
  user?: User;
};

export const registerPresenceHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const s = socket as Socket & { data: SocketData };

    const emitError = (message: string) => {
      socket.emit("error", { message });
    };

    const onActiveFile = (payload: ActiveFilePayload) => {
      const user = s.data.user;
      if (!user) {
        emitError("UNAUTHORIZED");
        return;
      }

      const { roomId, path } = payload;
      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      io.to(roomId).emit(SOCKET_EVENTS.ACTIVE_FILE_UPDATE, {
        roomId,
        path,
        user,
      });
    };

    const onCursorMove = (payload: CursorMovePayload) => {
      const user = s.data.user;
      if (!user) {
        emitError("UNAUTHORIZED");
        return;
      }

      const { roomId, path, cursor } = payload;
      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      socket.to(roomId).emit(SOCKET_EVENTS.CURSOR_MOVE, {
        roomId,
        path,
        cursor,
        user,
        from: socket.id,
      });
    };

    socket.on(SOCKET_EVENTS.ACTIVE_FILE, onActiveFile);
    socket.on(SOCKET_EVENTS.CURSOR_MOVE, onCursorMove);
  };

  io.on("connection", onConnection);
};
