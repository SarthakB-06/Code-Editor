import * as Y from "yjs";
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS, type CodeChangePayload } from "./events.js";
import { ensureRoomLoaded, roomState, toRoomFsSnapshot } from "./state.js";
import { scheduleRoomFsSave } from "../modules/room/roomFs.service.js";

export const registerEditorHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    socket.on(
      SOCKET_EVENTS.YJS_UPDATE,
      async (payload: { roomId: string; path: string; update: Buffer }) => {
        const { roomId, path, update } = payload;
        await ensureRoomLoaded(roomId);
        const state = roomState.get(roomId);
        if (!state) return;

        // Broadcast to other clients in room
        socket.to(roomId).emit(SOCKET_EVENTS.YJS_UPDATE, payload);

        // Apply update to server doc
        Y.applyUpdate(state.ydoc, new Uint8Array(update));

        // Sync back to our simple string state for saving
        const textObj = state.ydoc.getText(path);
        state.files.set(path, textObj.toString());
        state.version += 1;

        scheduleRoomFsSave(toRoomFsSnapshot(roomId));
      }
    );

    socket.on(
      SOCKET_EVENTS.YJS_AWARENESS,
      (payload: { roomId: string; update: Buffer }) => {
        socket.to(payload.roomId).emit(SOCKET_EVENTS.YJS_AWARENESS, payload);
      }
    );

    const onCodeChange = async (payload: CodeChangePayload) => {
      const { roomId, path, code } = payload;

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      state.files.set(path, code);
      state.version += 1;

      // also manually update Ydoc when a raw socket code-change happens (e.g file creation)
      const textObj = state.ydoc.getText(path);
      textObj.delete(0, textObj.length);
      textObj.insert(0, code);

      socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
        roomId,
        path,
        code: state.files.get(path) ?? "",
        version: state.version,
        from: socket.id,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    socket.on(SOCKET_EVENTS.CODE_CHANGE, onCodeChange);
  };

  io.on("connection", onConnection);
};
