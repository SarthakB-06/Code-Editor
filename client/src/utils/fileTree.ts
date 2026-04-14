export type TreeNode =
    | { type: "folder"; name: string; key: string; children: TreeNode[] }
    | { type: "file"; name: string; key: string; path: string };

export const sortPaths = (paths: string[]) => {
    const next = [...paths];
    next.sort((a, b) => a.localeCompare(b));
    return next;
};

export const buildTreeFromEntries = (
    folders: string[],
    files: string[],
): TreeNode[] => {
    type Folder = { folders: Map<string, Folder>; files: Set<string> };
    const root: Folder = { folders: new Map(), files: new Set() };

    const normalize = (p: string) => {
        return p
            .trim()
            .replace(/\\/g, "/")
            .replace(/\/+/g, "/")
            .replace(/^\/+/, "")
            .replace(/\/+$/, "");
    };

    const addFolderPath = (folderPath: string) => {
        const normalized = normalize(folderPath);
        if (!normalized) return;
        const parts = normalized.split("/").filter(Boolean);
        let cursor = root;
        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[i]!;
            if (!cursor.folders.has(part))
                cursor.folders.set(part, { folders: new Map(), files: new Set() });
            cursor = cursor.folders.get(part)!;
        }
    };

    const addFilePath = (filePath: string) => {
        const normalized = normalize(filePath);
        if (!normalized) return;
        const parts = normalized.split("/").filter(Boolean);
        if (parts.length === 0) return;

        let cursor = root;
        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[i]!;
            const isLast = i === parts.length - 1;
            if (isLast) {
                cursor.files.add(part);
            } else {
                if (!cursor.folders.has(part))
                    cursor.folders.set(part, { folders: new Map(), files: new Set() });
                cursor = cursor.folders.get(part)!;
            }
        }
    };

    for (const f of folders) addFolderPath(f);
    for (const f of files) addFilePath(f);

    const folderToNodes = (folder: Folder, prefix: string): TreeNode[] => {
        const nodes: TreeNode[] = [];

        const folderNames = Array.from(folder.folders.keys());
        folderNames.sort((a, b) => a.localeCompare(b));

        for (const name of folderNames) {
            const nextPrefix = prefix ? `${prefix}/${name}` : name;
            const child = folder.folders.get(name)!;
            nodes.push({
                type: "folder",
                name,
                key: `folder:${nextPrefix}`,
                children: folderToNodes(child, nextPrefix),
            });
        }

        const fileNames = Array.from(folder.files.values());
        fileNames.sort((a, b) => a.localeCompare(b));

        for (const name of fileNames) {
            const path = prefix ? `${prefix}/${name}` : name;
            nodes.push({ type: "file", name, key: `file:${path}`, path });
        }

        return nodes;
    };

    return folderToNodes(root, "");
};
