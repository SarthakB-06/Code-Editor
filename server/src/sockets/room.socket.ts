import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type JoinRoomPayload, type User } from './events.js';
import { ensureRoom, getUsers, roomUsers, roomState } from './state.js';

type SocketData = {
    roomId?: string;
    user?: User;
};

export function registerRoomHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        const s = socket as Socket & { data: SocketData };

        socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
            const { roomId } = payload;
            const authedUser = s.data.user;
            const user = authedUser ?? payload.user;

            if (!user) {
                socket.emit('error', { message: 'UNAUTHORIZED' });
                socket.disconnect(true);
                return;
            }

            s.data.roomId = roomId;
            s.data.user = user;

            ensureRoom(roomId);
            socket.join(roomId);

            roomUsers.get(roomId)!.set(socket.id, user);

            const state = roomState.get(roomId)!;

            socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
                roomId,
                code: state.code,
                version: state.version,
                users: getUsers(roomId),
            });

            socket.to(roomId).emit(SOCKET_EVENTS.USER_JOIN, { socketId: socket.id, user });
        });

        socket.on('disconnect', () => {
            const roomId = s.data.roomId;
            const user = s.data.user;
            if (!roomId || !user) return;

            roomUsers.get(roomId)?.delete(socket.id);
            socket.to(roomId).emit(SOCKET_EVENTS.USER_LEAVE, { socketId: socket.id, user });
        });
    });
}