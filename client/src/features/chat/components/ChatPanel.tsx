import { type FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../types";

interface ChatPanelProps {
    roomId: string;
    chatMessages: ChatMessage[];
    onSendChat: (text: string) => void;
    isActive: boolean;
}

const ChatPanel = ({
    roomId,
    chatMessages,
    onSendChat,
    isActive,
}: ChatPanelProps) => {
    const [chatInput, setChatInput] = useState("");
    const chatBottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isActive) {
            window.setTimeout(() => {
                chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    }, [chatMessages, isActive]);

    const handleSendChat = (e: FormEvent) => {
        e.preventDefault();
        if (!roomId || !chatInput.trim()) return;
        onSendChat(chatInput.trim());
        setChatInput("");
    };

    if (!isActive) return null;

    return (
        <div className="flex flex-col h-full bg-surface-container-low/30">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                        <span className="material-symbols-outlined text-4xl mb-2">
                            forum
                        </span>
                        <p className="text-xs">No messages yet</p>
                    </div>
                ) : (
                    chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-primary">
                                    {msg.senderName}
                                </span>
                                <span className="text-[9px] text-on-surface-variant opacity-70">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <p className="text-xs text-on-surface leading-relaxed break-words bg-surface-container border border-outline-variant/10 rounded-lg rounded-tl-none p-2 shadow-sm">
                                {msg.text}
                            </p>
                        </div>
                    ))
                )}
                <div ref={chatBottomRef} />
            </div>
            <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-outline-variant/20 bg-surface-container"
            >
                <div className="flex bg-surface-container-high border border-outline-variant/30 rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                    <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent px-3 py-2 text-xs text-on-surface focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="px-3 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
                    >
                        <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            send
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;
