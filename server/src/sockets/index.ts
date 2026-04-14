import type { Server } from "socket.io";
import { registerRoomHandlers } from "./room.socket.js";
import { registerEditorHandlers } from "./editor.socket.js";
import { registerPresenceHandlers } from "./presence.socket.js";
import { registerFilesHandlers } from "./files.socket.js";
import { registerFoldersHandlers } from "./folders.socket.js";
import { registerChatHandlers } from "./chat.socket.js";
import { registerExecutionHandlers } from "./execution.socket.js";

export const registerSockets = (io: Server) => {
  const registerAll = () => {
    registerRoomHandlers(io);
    registerFoldersHandlers(io);
    registerFilesHandlers(io);
    registerEditorHandlers(io);
    registerPresenceHandlers(io);
    registerChatHandlers(io);
    registerExecutionHandlers(io);
  };

  registerAll();
};
