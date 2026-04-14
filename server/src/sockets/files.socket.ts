import type { Server, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  type FileCreatePayload,
  type FileDeletePayload,
  type FileRenamePayload,
} from "./events.js";
import { ensureRoomLoaded, roomState, toRoomFsSnapshot } from "./state.js";
import {
  normalizeFolderPath,
  normalizePath,
  scheduleRoomFsSave,
} from "../modules/room/roomFs.service.js";

const addParentFolders = (state: { folders: Set<string> }, path: string) => {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return;

  let current = "";
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    current = current ? `${current}/${part}` : part;
    const folderPath = normalizeFolderPath(current);
    if (folderPath) state.folders.add(folderPath);
  }
};

export const registerFilesHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const emitError = (message: string) => {
      socket.emit("error", { message });
    };

    const onFileCreate = async (payload: FileCreatePayload) => {
      const roomId = payload.roomId;
      const path = normalizePath(payload.path);
      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (state.files.has(path)) {
        emitError("FILE_ALREADY_EXISTS");
        return;
      }

      addParentFolders(state, path);
      state.files.set(path, "");
      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FILE_CREATED, {
        roomId,
        path,
        version: state.version,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    const onFileRename = async (payload: FileRenamePayload) => {
      const roomId = payload.roomId;
      const fromPath = normalizePath(payload.fromPath);
      const toPath = normalizePath(payload.toPath);

      if (!roomId || !fromPath || !toPath) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (!state.files.has(fromPath)) {
        emitError("FILE_NOT_FOUND");
        return;
      }

      if (state.files.has(toPath)) {
        emitError("FILE_ALREADY_EXISTS");
        return;
      }

      const content = state.files.get(fromPath) ?? "";
      state.files.delete(fromPath);
      addParentFolders(state, toPath);
      state.files.set(toPath, content);
      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FILE_RENAMED, {
        roomId,
        fromPath,
        toPath,
        version: state.version,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    const onFileDelete = async (payload: FileDeletePayload) => {
      const roomId = payload.roomId;
      const path = normalizePath(payload.path);

      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (!state.files.has(path)) {
        emitError("FILE_NOT_FOUND");
        return;
      }

      if (state.files.size <= 1) {
        emitError("CANNOT_DELETE_LAST_FILE");
        return;
      }

      state.files.delete(path);
      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FILE_DELETED, {
        roomId,
        path,
        version: state.version,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    socket.on(SOCKET_EVENTS.FILE_CREATE, onFileCreate);
    socket.on(SOCKET_EVENTS.FILE_RENAME, onFileRename);
    socket.on(SOCKET_EVENTS.FILE_DELETE, onFileDelete);
  };

  io.on("connection", onConnection);
};
