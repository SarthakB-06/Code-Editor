import type { User } from './events.js';
import { getOrCreateRoomFs, type RoomFs } from '../modules/room/roomFs.service.js';

export type RoomFsState = { folders: Set<string>; files: Map<string, string>; version: number };

export const roomState = new Map<string, RoomFsState>();
export const roomUsers = new Map<string, Map<string, User>>();

const loadedRooms = new Set<string>();
const loadPromises = new Map<string, Promise<void>>();

export const ensureRoom = (roomId: string) => {
  if (!roomState.has(roomId)) roomState.set(roomId, { folders: new Set(), files: new Map(), version: 0 });
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
};

export const ensureRoomLoaded = async (roomId: string) => {
  ensureRoom(roomId);

  if (loadedRooms.has(roomId)) return;

  const existing = loadPromises.get(roomId);
  if (existing) return existing;

  const load = async () => {
    const fs = await getOrCreateRoomFs(roomId);
    const folders = new Set<string>();
    for (const folder of fs.folders ?? []) folders.add(folder);

    const files = new Map<string, string>();
    for (const f of fs.files) {
      files.set(f.path, f.content);
    }

    roomState.set(roomId, { folders, files, version: fs.version });
    loadedRooms.add(roomId);
  };

  const cleanup = () => {
    loadPromises.delete(roomId);
  };

  const promise = load().finally(cleanup);

  loadPromises.set(roomId, promise);
  return promise;
};

export const getUsers = (roomId: string): User[] => {
  return Array.from(roomUsers.get(roomId)?.values() ?? []);
};

export const getFileList = (roomId: string): { path: string }[] => {
  const state = roomState.get(roomId);
  if (!state) return [];

  const paths = Array.from(state.files.keys());
  paths.sort((a, b) => a.localeCompare(b));

  const list: { path: string }[] = [];
  for (const path of paths) list.push({ path });
  return list;
};

export const getFileContent = (roomId: string, path: string): string => {
  const state = roomState.get(roomId);
  if (!state) return '';
  return state.files.get(path) ?? '';
};

export const getDefaultActivePath = (roomId: string): string => {
  const state = roomState.get(roomId);
  if (!state) return 'main.ts';

  const paths = Array.from(state.files.keys());
  paths.sort((a, b) => a.localeCompare(b));
  return paths[0] ?? 'main.ts';
};

export const toRoomFsSnapshot = (roomId: string): RoomFs => {
  const state = roomState.get(roomId);

  const folders: string[] = [];
  if (state) {
    const list = Array.from(state.folders.values());
    list.sort((a, b) => a.localeCompare(b));
    for (const f of list) folders.push(f);
  }

  const files: { path: string; content: string }[] = [];
  if (state) {
    const entries = Array.from(state.files.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [path, content] of entries) files.push({ path, content });
  }

  return {
    roomId,
    version: state?.version ?? 0,
    folders,
    files,
  };
};