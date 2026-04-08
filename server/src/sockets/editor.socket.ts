import type { Server } from 'socket.io';
import { SOCKET_EVENTS, type CodeChangePayload } from './events.js';
import { ensureRoom, roomState } from './state.js';

export function registerEditorHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.CODE_CHANGE, (payload: CodeChangePayload) => {
      const { roomId, code } = payload;

      ensureRoom(roomId);
      const state = roomState.get(roomId)!;

      state.code = code;
      state.version += 1;

      socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
        roomId,
        code: state.code,
        version: state.version,
        from: socket.id,
      });
    });
  });
}


// currently this is a last write wins model and doesn't handle conflicts. In the future, we can implement OT or CRDT for better conflict resolution.