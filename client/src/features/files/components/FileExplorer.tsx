import { useState, type MouseEvent, type ReactNode } from "react";
import type { TreeNode } from "../../../utils/fileTree";

interface FileExplorerProps {
    roomId?: string;
    fileTree: TreeNode[];
    activePath: string;
    selectedFolderPath: string;
    socketError: string | null;
    onSelectFile: (path: string) => void;
    onSelectFolder: (path: string) => void;
    onCreateFile: (path: string) => void;
    onCreateFolder: (path: string) => void;
    onRenameFile: (fromPath: string, toPath: string) => void;
    onRenameFolder: (fromPath: string, toPath: string) => void;
    onDeleteFile: (path: string) => void;
    onDeleteFolder: (path: string) => void;
    renameToPath: string;
    setRenameToPath: (v: string) => void;
    renameFolderToPath: string;
    setRenameFolderToPath: (v: string) => void;
}

const FileExplorer = ({
    roomId,
    fileTree,
    activePath,
    selectedFolderPath,
    socketError,
    onSelectFile,
    onSelectFolder,
    onCreateFile,
    onCreateFolder,
    onRenameFile,
    onRenameFolder,
    onDeleteFile,
    onDeleteFolder,
    renameToPath,
    setRenameToPath,
    renameFolderToPath,
    setRenameFolderToPath,
}: FileExplorerProps) => {
    const [newFilePath, setNewFilePath] = useState("");
    const [newFolderPath, setNewFolderPath] = useState("");

    const handleCreateFile = () => {
        if (!roomId) return;
        const trimmed = newFilePath.trim();
        if (!trimmed) return;
        onCreateFile(trimmed);
        setNewFilePath("");
    };

    const handleCreateFolder = () => {
        if (!roomId) return;
        const trimmed = newFolderPath.trim();
        if (!trimmed) return;
        onCreateFolder(trimmed);
        setNewFolderPath("");
    };

    const handleRenameFile = () => {
        if (!roomId || !activePath) return;
        const trimmed = renameToPath.trim();
        if (!trimmed || trimmed === activePath) return;
        onRenameFile(activePath, trimmed);
    };

    const handleRenameFolder = () => {
        if (!roomId || !selectedFolderPath) return;
        const trimmed = renameFolderToPath.trim();
        if (!trimmed || trimmed === selectedFolderPath) return;
        onRenameFolder(selectedFolderPath, trimmed);
    };

    const handleFileSelectClick = (e: MouseEvent<HTMLButtonElement>) => {
        const path = e.currentTarget.dataset.path ?? "";
        onSelectFile(path);
    };

    const handleFolderSelectClick = (e: MouseEvent<HTMLButtonElement>) => {
        const path = e.currentTarget.dataset.folder ?? "";
        onSelectFolder(path);
    };

    const handleDeleteFile = () => {
        if (!roomId || !activePath) return;
        onDeleteFile(activePath);
    };

    const handleDeleteFolder = () => {
        if (!roomId || !selectedFolderPath) return;
        onDeleteFolder(selectedFolderPath);
    };

    const renderTree = (nodes: TreeNode[], depth: number): ReactNode[] => {
        const out: ReactNode[] = [];

        for (const node of nodes) {
            if (node.type === "folder") {
                const isSelected = node.key === `folder:${selectedFolderPath}`;
                out.push(
                    <div key={node.key}>
                        <button
                            type="button"
                            data-folder={node.key.replace(/^folder:/, "")}
                            onClick={handleFolderSelectClick}
                            style={{ paddingLeft: depth * 12 + 8 }}
                            className={`flex items-center w-full text-left text-sm py-1.5 px-2 hover:bg-surface-variant/40 rounded transition-colors text-on-surface-variant ${isSelected ? "bg-surface-variant/60 font-semibold" : "font-medium"}`}
                        >
                            <span
                                className="material-symbols-outlined text-sm mr-2 text-amber-500/80"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                folder
                            </span>
                            {node.name}
                        </button>
                        <div className="pl-2">{renderTree(node.children, depth + 1)}</div>
                    </div>,
                );
            } else {
                const isActive = node.path === activePath;
                out.push(
                    <button
                        key={node.key}
                        type="button"
                        data-path={node.path}
                        onClick={handleFileSelectClick}
                        style={{ paddingLeft: depth * 12 + 8 }}
                        className={`flex items-center w-full text-left text-sm py-1.5 px-2 hover:bg-surface-variant/40 rounded transition-colors text-on-surface-variant ${isActive ? "bg-primary/10 text-primary font-medium border-l-[3px] border-primary" : "border-l-[3px] border-transparent"}`}
                    >
                        <span className="material-symbols-outlined text-sm mr-2 text-blue-400">
                            description
                        </span>
                        {node.name}
                    </button>,
                );
            }
        }

        return out;
    };

    return (
        <aside className="hidden md:flex flex-col w-60 bg-surface-container-low border-r border-outline-variant/20 shrink-0">
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        Explorer
                    </span>
                </div>

                <div className="flex gap-2 pt-2">
                    <input
                        value={newFilePath}
                        onChange={(e) => setNewFilePath(e.target.value)}
                        placeholder="file.ts"
                        className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={handleCreateFile}
                        title="New File"
                        disabled={!roomId || !newFilePath.trim()}
                        className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">note_add</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        value={newFolderPath}
                        onChange={(e) => setNewFolderPath(e.target.value)}
                        placeholder="folder"
                        className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={handleCreateFolder}
                        title="New Folder"
                        disabled={!roomId || !newFolderPath.trim()}
                        className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">
                            create_new_folder
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {fileTree.length ? (
                    renderTree(fileTree, 0)
                ) : (
                    <div className="text-xs text-on-surface-variant p-2">Empty</div>
                )}
            </div>

            <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-2">
                {socketError && <div className="text-xs text-error">{socketError}</div>}
                <div className="flex gap-2 pb-2">
                    <input
                        value={selectedFolderPath ? renameFolderToPath : renameToPath}
                        onChange={(e) =>
                            selectedFolderPath
                                ? setRenameFolderToPath(e.target.value)
                                : setRenameToPath(e.target.value)
                        }
                        className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Rename to..."
                    />
                    <button
                        disabled={!activePath && !selectedFolderPath}
                        onClick={selectedFolderPath ? handleRenameFolder : handleRenameFile}
                        className="px-3 py-1.5 bg-surface-variant hover:bg-surface-bright disabled:opacity-50 transition-colors rounded text-xs font-semibold cursor-pointer"
                    >
                        Rename
                    </button>
                </div>
                <button
                    disabled={!activePath && !selectedFolderPath}
                    onClick={selectedFolderPath ? handleDeleteFolder : handleDeleteFile}
                    className="w-full py-2 text-error font-bold text-xs rounded border border-error/20 hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Delete Selected
                </button>
            </div>
        </aside>
    );
};

export default FileExplorer;
