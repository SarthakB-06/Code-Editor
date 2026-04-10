import type { User } from './events.js';
import { getOrCreateDocument } from '../modules/document/document.service.js';

export type RoomDocState = { code: string; version: number };

export const roomState = new Map<string, RoomDocState>();
export const roomUsers = new Map<string, Map<string, User>>();

const loadedRooms = new Set<string>();
const loadPromises = new Map<string, Promise<void>>();

export const ensureRoom = (roomId: string) => {
  if (!roomState.has(roomId)) roomState.set(roomId, { code: '', version: 0 });
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
};

export const ensureRoomLoaded = async (roomId: string) => {
  ensureRoom(roomId);

  if (loadedRooms.has(roomId)) return;

  const existing = loadPromises.get(roomId);
  if (existing) return existing;

  const load = async () => {
    const doc = await getOrCreateDocument(roomId);
    roomState.set(roomId, { code: doc.code, version: doc.version });
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