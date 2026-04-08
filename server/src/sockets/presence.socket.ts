import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type CursorMovePayload } from './events.js';

export function registerPresenceHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.CURSOR_MOVE, (payload: CursorMovePayload) => {
      const { roomId, cursor } = payload;
      socket.to(roomId).emit(SOCKET_EVENTS.CURSOR_MOVE, {
        roomId,
        cursor,
        from: socket.id,
      });
    });
  });
}