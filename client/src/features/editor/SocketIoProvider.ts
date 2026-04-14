import * as Y from "yjs";
import { Socket } from "socket.io-client";
import { Awareness } from "y-protocols/awareness";

export class SocketIoProvider {
    doc: Y.Doc;
    socket: Socket;
    roomId: string;
    awareness: Awareness;

    constructor(socket: Socket, roomId: string, doc: Y.Doc) {
        this.socket = socket;
        this.roomId = roomId;
        this.doc = doc;
        this.awareness = new Awareness(doc);

        this.doc.on("update", this.onUpdate);
        this.awareness.on("update", this.onAwarenessUpdate);
        this.socket.on("yjs-update", this.onSocketUpdate);
        this.socket.on("yjs-awareness", this.onSocketAwareness);
    }

    private onUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin !== this) {
            this.socket.emit("yjs-update", {
                roomId: this.roomId,
                path: "room-level", // Send global doc update (for active file later)
                update: update,
            });
        }
    };

    private onAwarenessUpdate = ({ added, updated, removed }: { added: number[], updated: number[], removed: number[] }, origin: unknown) => {
        if (origin !== this) {
            import("y-protocols/awareness").then(({ encodeAwarenessUpdate }) => {
                const encoded = encodeAwarenessUpdate(this.awareness, [...added, ...updated, ...removed]);
                this.socket.emit("yjs-awareness", {
                    roomId: this.roomId,
                    update: encoded,
                });
            });
        }
    };

    private onSocketUpdate = (payload: { roomId: string; update: ArrayBuffer }) => {
        if (payload.roomId === this.roomId) {
            Y.applyUpdate(this.doc, new Uint8Array(payload.update), this);
        }
    };

    private onSocketAwareness = async (payload: { roomId: string; update: ArrayBuffer }) => {
        if (payload.roomId === this.roomId) {
            const { applyAwarenessUpdate } = await import("y-protocols/awareness");
            applyAwarenessUpdate(this.awareness, new Uint8Array(payload.update), this);
        }
    };

    destroy() {
        this.doc.off("update", this.onUpdate);
        this.awareness.off("update", this.onAwarenessUpdate);
        this.socket.off("yjs-update", this.onSocketUpdate);
        this.socket.off("yjs-awareness", this.onSocketAwareness);
        this.awareness.destroy();
    }
}
