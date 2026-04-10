import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type CodeChangePayload } from './events.js';
import { ensureRoomLoaded, roomState } from './state.js';
import { scheduleDocumentSave } from '../modules/document/document.service.js';

export const registerEditorHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const onCodeChange = async (payload: CodeChangePayload) => {
      const { roomId, code } = payload;

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      state.code = code;
      state.version += 1;

      socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
        roomId,
        code: state.code,
        version: state.version,
        from: socket.id,
      });

      scheduleDocumentSave({ roomId, code: state.code, version: state.version });
    };

    socket.on(SOCKET_EVENTS.CODE_CHANGE, onCodeChange);
  };

  io.on('connection', onConnection);
};


// currently this is a last write wins model and doesn't handle conflicts. In the future, we can implement OT or CRDT for better conflict resolution.