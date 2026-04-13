export const SOCKET_EVENTS = {
    JOIN_ROOM: 'join-room',
    ROOM_JOINED: 'room-joined',
    USER_JOIN: 'user-join',
    USER_LEAVE: 'user-leave',

    FOLDER_CREATE: 'folder-create',
    FOLDER_CREATED: 'folder-created',
    FOLDER_RENAME: 'folder-rename',
    FOLDER_RENAMED: 'folder-renamed',
    FOLDER_DELETE: 'folder-delete',
    FOLDER_DELETED: 'folder-deleted',

    FILE_CREATE: 'file-create',
    FILE_CREATED: 'file-created',
    FILE_RENAME: 'file-rename',
    FILE_RENAMED: 'file-renamed',
    FILE_DELETE: 'file-delete',
    FILE_DELETED: 'file-deleted',

    CODE_CHANGE: 'code-change',
    CODE_UPDATE: 'code-update',

    ACTIVE_FILE: 'active-file',
    ACTIVE_FILE_UPDATE: 'active-file-update',

    CURSOR_MOVE: 'cursor-move',

    CHAT_SEND: 'chat-send',
    CHAT_MESSAGE: 'chat-message',
    CHAT_HISTORY: 'chat-history',

    CODE_RUN: 'code-run',
    CODE_EXECUTION_START: 'code-execution-start',
    CODE_EXECUTION_RESULT: 'code-execution-result',
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
    folders: { path: string }[];
    files: { path: string; content: string }[];
    activePath: string;
    code: string;
    version: number;
    users: User[];
};


export type FolderCreatePayload = {
    roomId: string;
    path: string;
};

export type FolderCreatedPayload = {
    roomId: string;
    path: string;
    version: number;
};

export type FolderRenamePayload = {
    roomId: string;
    fromPath: string;
    toPath: string;
};

export type FolderRenamedPayload = {
    roomId: string;
    fromPath: string;
    toPath: string;
    version: number;
    folders: { fromPath: string; toPath: string }[];
    files: { fromPath: string; toPath: string }[];
};

export type FolderDeletePayload = {
    roomId: string;
    path: string;
};

export type FolderDeletedPayload = {
    roomId: string;
    path: string;
    version: number;
};


export type FileCreatePayload = {
    roomId: string;
    path: string;
};

export type FileCreatedPayload = {
    roomId: string;
    path: string;
    version: number;
};

export type FileRenamePayload = {
    roomId: string;
    fromPath: string;
    toPath: string;
};

export type FileRenamedPayload = {
    roomId: string;
    fromPath: string;
    toPath: string;
    version: number;
};

export type FileDeletePayload = {
    roomId: string;
    path: string;
};

export type FileDeletedPayload = {
    roomId: string;
    path: string;
    version: number;
};


export type CodeChangePayload = {
    roomId: string;
    path: string;
    code: string;
};

export type CodeUpdatePayload = {
    roomId: string;
    path: string;
    code: string;
    version: number;
    from: string;
};

export type CursorMovePayload = {
    roomId: string;
    path: string;
    cursor: {
        lineNumber: number;
        column: number;
        selection?: {
            startLineNumber: number;
            startColumn: number;
            endLineNumber: number;
            endColumn: number;
        };
    };
};

export type ActiveFilePayload = {
    roomId: string;
    path: string;
};

export type ChatMessagePayload = {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
};

export type ChatSendPayload = {
    roomId: string;
    text: string;
};

export type CodeRunPayload = {
    roomId: string;
    entryPath: string; // The file they were viewing when they clicked run
};

export type CodeExecutionResultPayload = {
    roomId: string;
    runStatus: {
        stdout: string;
        stderr: string;
        code: number;
    };
    compileStatus?: {
        stdout: string;
        stderr: string;
        code: number;
    };
    language: string;
    version: string;
};


