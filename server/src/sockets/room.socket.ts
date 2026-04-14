import * as Y from "yjs";
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS, type JoinRoomPayload, type User } from "./events.js";
import {
    ensureRoomLoaded,
    getDefaultActivePath,
    getUsers,
    roomUsers,
    roomState,
    toRoomFsSnapshot,
} from "./state.js";

type SocketData = {
    roomId?: string;
    user?: User;
};

export const registerRoomHandlers = (io: Server) => {
    const onConnection = (socket: Socket) => {
        const s = socket as Socket & { data: SocketData };

        const onJoinRoom = async (payload: JoinRoomPayload) => {
            const { roomId } = payload;
            const authedUser = s.data.user;
            const user = authedUser ?? payload.user;

            if (!user) {
                socket.emit("error", { message: "UNAUTHORIZED" });
                socket.disconnect(true);
                return;
            }

            s.data.roomId = roomId;
            s.data.user = user;

            await ensureRoomLoaded(roomId);
            socket.join(roomId);

            roomUsers.get(roomId)!.set(socket.id, user);

            const state = roomState.get(roomId)!;
            const activePath = getDefaultActivePath(roomId);
            const snapshot = toRoomFsSnapshot(roomId);

            socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
                roomId,
                folders: snapshot.folders.map((p) => ({ path: p })),
                files: snapshot.files,
                activePath,
                code: state.files.get(activePath) ?? "",
                version: state.version,
                users: getUsers(roomId),
                yjsState: Buffer.from(Y.encodeStateAsUpdate(state.ydoc)),
            });

            socket
                .to(roomId)
                .emit(SOCKET_EVENTS.USER_JOIN, { socketId: socket.id, user });
        };

        const onDisconnect = () => {
            const roomId = s.data.roomId;
            const user = s.data.user;
            if (!roomId || !user) return;

            roomUsers.get(roomId)?.delete(socket.id);
            socket
                .to(roomId)
                .emit(SOCKET_EVENTS.USER_LEAVE, { socketId: socket.id, user });
        };

        socket.on(SOCKET_EVENTS.JOIN_ROOM, onJoinRoom);
        socket.on("disconnect", onDisconnect);
    };

    io.on("connection", onConnection);
};
