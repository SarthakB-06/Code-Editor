import type { Socket } from "socket.io";

import { verifyAccessToken } from "../modules/auth/auth.service.js";
import { findUserById } from "../modules/user/user.service.js";
import type { User } from "./events.js";

type SocketData = {
  user?: User;
};

export const socketAuthMiddleware = async (socket: Socket) => {
  const s = socket as Socket & { data: SocketData };

  const token =
    (socket.handshake.auth as { token?: string } | undefined)?.token ??
    (typeof socket.handshake.headers.authorization === "string"
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined);

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const payload = verifyAccessToken(token);

  const dbUser = await findUserById(payload.sub);
  if (!dbUser) throw new Error("UNAUTHORIZED");

  s.data.user = {
    id: dbUser._id,
    name: dbUser.name,
  };
};
