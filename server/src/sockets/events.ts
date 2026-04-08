export const SOCKET_EVENTS = {
    JOIN_ROOM: "join_room",
    ROOM_JOINED: "room_joined",
    USER_JOIN: "user_join",
    USER_LEAVE: "user_leave",

    CODE_CHANGE: "code_change",
    CODE_UPDATE: "code_update",

    CURSOR_MOVE: "cursor_move",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type User = {
    id: string;
    name : string;
    color? : string;
}


export type JoinRoomPayload = {
    roomId: string;
    user: User;
}

export type RoomJoinedPayload = {
    roomId: string;
    code: string;
    version: number;
    users: User[];
}


export type CodeChangePayload = {
    roomId: string;
    code: string;
}

export type CodeUpdatePayload = {
    roomId: string;
    code: string;
    version: number;
    from: string;
}

export type CursorMovePayload = {
    roomId: string;
    cursor: unknown;
}


