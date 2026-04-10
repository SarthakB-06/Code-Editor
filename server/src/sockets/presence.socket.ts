import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type CursorMovePayload } from './events.js';

export const registerPresenceHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const onCursorMove = (payload: CursorMovePayload) => {
      const { roomId, cursor } = payload;
      socket.to(roomId).emit(SOCKET_EVENTS.CURSOR_MOVE, {
        roomId,
        cursor,
        from: socket.id,
      });
    };

    socket.on(SOCKET_EVENTS.CURSOR_MOVE, onCursorMove);
  };

  io.on('connection', onConnection);
};