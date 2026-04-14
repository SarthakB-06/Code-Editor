import type { Server, Socket } from "socket.io";

import {
  SOCKET_EVENTS,
  type FolderCreatePayload,
  type FolderDeletePayload,
  type FolderRenamePayload,
} from "./events.js";
import { ensureRoomLoaded, roomState, toRoomFsSnapshot } from "./state.js";
import {
  normalizeFolderPath,
  normalizePath,
  scheduleRoomFsSave,
} from "../modules/room/roomFs.service.js";

const getParentFoldersForFolder = (folderPath: string): string[] => {
  const normalized = normalizeFolderPath(folderPath);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return [];

  const parents: string[] = [];
  let current = "";
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    current = current ? `${current}/${part}` : part;
    parents.push(current);
  }

  return parents;
};

const isPathInsideFolder = (path: string, folder: string) => {
  const f = normalizeFolderPath(folder);
  const p = normalizePath(path);
  if (!f) return false;
  return p === f || p.startsWith(`${f}/`);
};

export const registerFoldersHandlers = (io: Server) => {
  const onConnection = (socket: Socket) => {
    const emitError = (message: string) => {
      socket.emit("error", { message });
    };

    const onFolderCreate = async (payload: FolderCreatePayload) => {
      const roomId = payload.roomId;
      const path = normalizeFolderPath(payload.path);

      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (state.folders.has(path)) {
        emitError("FOLDER_ALREADY_EXISTS");
        return;
      }

      const parents = getParentFoldersForFolder(path);
      for (const p of parents) state.folders.add(normalizeFolderPath(p));

      state.folders.add(path);
      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FOLDER_CREATED, {
        roomId,
        path,
        version: state.version,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    const onFolderRename = async (payload: FolderRenamePayload) => {
      const roomId = payload.roomId;
      const fromPath = normalizeFolderPath(payload.fromPath);
      const toPath = normalizeFolderPath(payload.toPath);

      if (!roomId || !fromPath || !toPath) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      if (fromPath === toPath) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (!state.folders.has(fromPath)) {
        emitError("FOLDER_NOT_FOUND");
        return;
      }

      if (state.folders.has(toPath)) {
        emitError("FOLDER_ALREADY_EXISTS");
        return;
      }

      const renamedFolders: { fromPath: string; toPath: string }[] = [];
      const renamedFiles: { fromPath: string; toPath: string }[] = [];

      const folders = Array.from(state.folders.values());
      folders.sort((a, b) => a.localeCompare(b));

      for (const f of folders) {
        if (!isPathInsideFolder(f, fromPath)) continue;

        const suffix = f === fromPath ? "" : f.slice(fromPath.length);
        const next = normalizeFolderPath(`${toPath}${suffix}`);

        if (state.folders.has(next) && !isPathInsideFolder(next, fromPath)) {
          emitError("FOLDER_RENAME_COLLISION");
          return;
        }

        renamedFolders.push({ fromPath: f, toPath: next });
      }

      const files = Array.from(state.files.keys());
      files.sort((a, b) => a.localeCompare(b));

      for (const p of files) {
        if (!isPathInsideFolder(p, fromPath)) continue;

        const suffix = p === fromPath ? "" : p.slice(fromPath.length);
        const next = normalizePath(`${toPath}${suffix}`);

        if (state.files.has(next) && !isPathInsideFolder(next, fromPath)) {
          emitError("FILE_RENAME_COLLISION");
          return;
        }

        renamedFiles.push({ fromPath: p, toPath: next });
      }

      for (const entry of renamedFolders) {
        state.folders.delete(entry.fromPath);
      }
      const parents = getParentFoldersForFolder(toPath);
      for (const p of parents) state.folders.add(normalizeFolderPath(p));
      for (const entry of renamedFolders) {
        state.folders.add(entry.toPath);
      }

      for (const entry of renamedFiles) {
        const content = state.files.get(entry.fromPath) ?? "";
        state.files.delete(entry.fromPath);
        state.files.set(entry.toPath, content);
      }

      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FOLDER_RENAMED, {
        roomId,
        fromPath,
        toPath,
        version: state.version,
        folders: renamedFolders,
        files: renamedFiles,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    const onFolderDelete = async (payload: FolderDeletePayload) => {
      const roomId = payload.roomId;
      const path = normalizeFolderPath(payload.path);

      if (!roomId || !path) {
        emitError("INVALID_PAYLOAD");
        return;
      }

      await ensureRoomLoaded(roomId);
      const state = roomState.get(roomId)!;

      if (!state.folders.has(path)) {
        emitError("FOLDER_NOT_FOUND");
        return;
      }

      for (const f of state.folders) {
        if (f !== path && isPathInsideFolder(f, path)) {
          emitError("FOLDER_NOT_EMPTY");
          return;
        }
      }

      for (const filePath of state.files.keys()) {
        if (isPathInsideFolder(filePath, path)) {
          emitError("FOLDER_NOT_EMPTY");
          return;
        }
      }

      state.folders.delete(path);
      state.version += 1;

      io.to(roomId).emit(SOCKET_EVENTS.FOLDER_DELETED, {
        roomId,
        path,
        version: state.version,
      });

      scheduleRoomFsSave(toRoomFsSnapshot(roomId));
    };

    socket.on(SOCKET_EVENTS.FOLDER_CREATE, onFolderCreate);
    socket.on(SOCKET_EVENTS.FOLDER_RENAME, onFolderRename);
    socket.on(SOCKET_EVENTS.FOLDER_DELETE, onFolderDelete);
  };

  io.on("connection", onConnection);
};
