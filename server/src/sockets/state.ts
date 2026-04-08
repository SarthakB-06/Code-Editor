import type { User } from './events.js';

export type RoomDocState = { code: string; version: number };

export const roomState = new Map<string, RoomDocState>();
export const roomUsers = new Map<string, Map<string, User>>();

export function ensureRoom(roomId: string) {
  if (!roomState.has(roomId)) roomState.set(roomId, { code: '', version: 0 });
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
}

export function getUsers(roomId: string): User[] {
  return Array.from(roomUsers.get(roomId)?.values() ?? []);
}