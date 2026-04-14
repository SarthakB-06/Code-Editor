import type { User } from "../../../types";
import { getAccentClasses } from "../../../utils/colors";

interface PresencePanelProps {
  users: User[];
  activeFileByUserId: Record<string, string>;
  version: number;
  roomId?: string;
  isActive: boolean;
}

const PresencePanel = ({
    users,
    activeFileByUserId,
    version,
    roomId,
    isActive,
}: PresencePanelProps) => {
    if (!isActive) return null;

    return (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                <span>{users.length} Active Users</span>
            </div>

            <div className="space-y-2">
                {users.map((u) => (
                    <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-high/50 border border-outline-variant/10 hover:border-outline-variant/30 transition-all cursor-pointer"
                    >
                        <div className="relative shrink-0">
                            <div
                                className={`w-10 h-10 rounded-full border-2 ${getAccentClasses(u.id).border} flex items-center justify-center bg-surface uppercase font-bold text-lg text-primary`}
                            >
                                {u.name[0]}
                            </div>
                            <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getAccentClasses(u.id).dot} border-2 border-surface-container rounded-full animate-pulse`}
                            ></div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-on-surface truncate">
                                {u.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant truncate">
                                {activeFileByUserId[u.id]
                                    ? `Editing: ${activeFileByUserId[u.id]}`
                                    : "Online"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-2">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                    System Info
                </span>
                <p className="text-[9px] text-on-surface-variant leading-tight">
                    Version: <span className="text-primary">{version}</span>
                </p>
                <p className="text-[9px] text-on-surface-variant leading-tight overflow-hidden text-ellipsis selection:bg-primary/50">
                    Room: {roomId}
                </p>
            </div>
        </div>
    );
};

export default PresencePanel;

