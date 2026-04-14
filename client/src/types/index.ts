export type User = {
    id: string;
    name: string;
    color?: string;
};

export type RoomFile = {
    path: string;
    content: string;
};

export type Cursor = {
    lineNumber: number;
    column: number;
    selection?: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
};

export type ChatMessage = {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
};
