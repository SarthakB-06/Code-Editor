import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "../auth/authService";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket) return socket;

  const url = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
  const token = getAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  socket = io(url, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
