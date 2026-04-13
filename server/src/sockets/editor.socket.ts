import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type CodeChangePayload } from './events.js';
import { ensureRoomLoaded, roomState, toRoomFsSnapshot } from './state.js';
import { scheduleRoomFsSave } from '../modules/room/roomFs.service.js';

export const registerEditorHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const onCodeChange = async (payload: CodeChangePayload) => {
      const { roomId, path, code } = payload;

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      state.files.set(path, code);
      state.version += 1;

      socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
        roomId,
        path,
        code: state.files.get(path) ?? '',
        version: state.version,
        from: socket.id,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    socket.on(SOCKET_EVENTS.CODE_CHANGE, onCodeChange);
  };

  io.on('connection', onConnection);
};


// currently this is a last write wins model and doesn't handle conflicts. In the future, we can implement OT or CRDT for better conflict resolution.