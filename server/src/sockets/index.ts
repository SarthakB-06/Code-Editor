import type { Server } from 'socket.io';
import { registerRoomHandlers } from './room.socket.js';
import { registerEditorHandlers } from './editor.socket.js';
import { registerPresenceHandlers } from './presence.socket.js';

export function registerSockets(io: Server) {
  registerRoomHandlers(io);
  registerEditorHandlers(io);
  registerPresenceHandlers(io);
}