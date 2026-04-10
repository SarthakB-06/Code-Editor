import type { Socket } from 'socket.io';

import { verifyAccessToken } from '../modules/auth/auth.service.js';
import type { User } from './events.js';

type SocketData = {
    user?: User;
};

export const socketAuthMiddleware = (socket: Socket) => {
    const s = socket as Socket & { data: SocketData };

    const token =
        (socket.handshake.auth as { token?: string } | undefined)?.token ??
        (typeof socket.handshake.headers.authorization === 'string'
            ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
            : undefined);

    if (!token) {
        throw new Error('UNAUTHORIZED');
    }

    const payload = verifyAccessToken(token);

    s.data.user = {
        id: payload.sub,
        name: payload.name || payload.email,
    };
};
