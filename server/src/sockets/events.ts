export const SOCKET_EVENTS = {
    JOIN_ROOM: 'join-room',
    ROOM_JOINED: 'room-joined',
    USER_JOIN: 'user-join',
    USER_LEAVE: 'user-leave',

    CODE_CHANGE: 'code-change',
    CODE_UPDATE: 'code-update',

    CURSOR_MOVE: 'cursor-move',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type User = {
    id: string;
    name: string;
    color?: string;
};


export type JoinRoomPayload = {
    roomId: string;
    user?: User;
};

export type RoomJoinedPayload = {
    roomId: string;
    code: string;
    version: number;
    users: User[];
};


export type CodeChangePayload = {
    roomId: string;
    code: string;
};

export type CodeUpdatePayload = {
    roomId: string;
    code: string;
    version: number;
    from: string;
};

export type CursorMovePayload = {
    roomId: string;
    cursor: unknown;
};


