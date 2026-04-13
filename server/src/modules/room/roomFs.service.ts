import { DocumentModel } from '../document/document.model.js';
import { RoomFsModel, type RoomFileDb, type RoomFsDb } from './roomFs.model.js';

export type RoomFile = {
    path: string;
    content: string;
};

export type RoomFs = {
    roomId: string;
    version: number;
    folders: string[];
    files: RoomFile[];
};

const DEFAULT_FILE_PATH = 'main.ts';
const DEFAULT_FILE_CONTENT = '// Start coding...\n';

const pendingSaveTimers = new Map<string, NodeJS.Timeout>();
const latestPending = new Map<string, RoomFs>();

export const normalizePath = (path: string) => {
    const replaced = path.trim().replace(/\\/g, '/');
    const collapsed = replaced.replace(/\/+/g, '/');
    const stripped = collapsed.replace(/^\/+/, '');
    return stripped;
};

export const normalizeFolderPath = (path: string) => {
    const normalized = normalizePath(path);
    return normalized.replace(/\/+$/, '');
};

const getParentFoldersForPath = (path: string): string[] => {
    const normalized = normalizePath(path);
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length <= 1) return [];

    const folders: string[] = [];
    let current = '';
    for (let i = 0; i < parts.length - 1; i += 1) {
        const part = parts[i]!;
        current = current ? `${current}/${part}` : part;
        folders.push(current);
    }

    return folders;
};

const dedupeFolderPaths = (folders: string[]): string[] => {
    const set = new Set<string>();
    for (const f of folders) {
        const p = normalizeFolderPath(f);
        if (!p) continue;
        set.add(p);
    }

    const list = Array.from(set.values());
    list.sort((a, b) => a.localeCompare(b));
    return list;
};

const dedupeFilesByPath = (files: RoomFile[]): RoomFile[] => {
    const byPath = new Map<string, RoomFile>();

    for (const f of files) {
        const p = normalizePath(f.path);
        if (!p) continue;
        if (!byPath.has(p)) byPath.set(p, { path: p, content: f.content ?? '' });
    }

    return Array.from(byPath.values());
};

const toRoomFs = (doc: RoomFsDb): RoomFs => {
    const files: RoomFile[] = [];
    for (const f of doc.files ?? []) {
        files.push({ path: normalizePath(f.path), content: f.content ?? '' });
    }

    const folders = dedupeFolderPaths(doc.folders ?? []);

    return {
        roomId: doc.roomId,
        version: doc.version ?? 0,
        folders,
        files,
    };
};

const buildInitialFs = async (
    roomId: string,
): Promise<{ version: number; folders: string[]; files: RoomFileDb[] }> => {
    const existingDoc = await DocumentModel.findOne({ roomId }).lean().exec();

    if (existingDoc && typeof existingDoc.code === 'string' && existingDoc.code.length > 0) {
        const folders = getParentFoldersForPath(DEFAULT_FILE_PATH);
        return {
            version: typeof existingDoc.version === 'number' ? existingDoc.version : 0,
            folders,
            files: [{ path: DEFAULT_FILE_PATH, content: existingDoc.code }],
        };
    }

    return {
        version: 0,
        folders: getParentFoldersForPath(DEFAULT_FILE_PATH),
        files: [{ path: DEFAULT_FILE_PATH, content: DEFAULT_FILE_CONTENT }],
    };
};

export const getOrCreateRoomFs = async (roomId: string): Promise<RoomFs> => {
    const existing = await RoomFsModel.findOne({ roomId }).lean().exec();
    if (existing) {
        const fs = toRoomFs(existing as RoomFsDb);
        const files = dedupeFilesByPath(fs.files);

        const derivedFolders: string[] = [];
        for (const f of files) derivedFolders.push(...getParentFoldersForPath(f.path));

        const folders = dedupeFolderPaths([...(fs.folders ?? []), ...derivedFolders]);
        return { ...fs, folders, files };
    }

    const initial = await buildInitialFs(roomId);

    const created = await RoomFsModel.findOneAndUpdate(
        { roomId },
        {
            $setOnInsert: {
                roomId,
                version: initial.version,
                folders: dedupeFolderPaths(initial.folders),
                files: initial.files,
            },
        },
        { upsert: true, new: true },
    )
        .lean()
        .exec();

    if (!created) {
        return {
            roomId,
            version: initial.version,
            folders: dedupeFolderPaths(initial.folders),
            files: initial.files,
        };
    }

    const fs = toRoomFs(created as RoomFsDb);
    const files = dedupeFilesByPath(fs.files);
    const derivedFolders: string[] = [];
    for (const f of files) derivedFolders.push(...getParentFoldersForPath(f.path));

    return {
        ...fs,
        folders: dedupeFolderPaths([...(fs.folders ?? []), ...derivedFolders]),
        files,
    };
};

export const saveRoomFs = async (input: RoomFs) => {
    const normalized: RoomFile[] = [];
    for (const f of input.files) {
        normalized.push({ path: normalizePath(f.path), content: f.content ?? '' });
    }

    const files = dedupeFilesByPath(normalized);

    const dbFiles: RoomFileDb[] = [];
    for (const f of files) {
        dbFiles.push({ path: f.path, content: f.content });
    }

    const derivedFolders: string[] = [];
    for (const f of files) derivedFolders.push(...getParentFoldersForPath(f.path));

    const folders = dedupeFolderPaths([...(input.folders ?? []), ...derivedFolders]);

    await RoomFsModel.updateOne(
        { roomId: input.roomId },
        {
            $set: {
                version: input.version,
                folders,
                files: dbFiles,
            },
        },
        { upsert: true },
    );
};

export const scheduleRoomFsSave = (input: RoomFs, debounceMs = 500) => {
    latestPending.set(input.roomId, input);

    const existing = pendingSaveTimers.get(input.roomId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
        pendingSaveTimers.delete(input.roomId);

        const latest = latestPending.get(input.roomId);
        if (!latest) return;

        try {
            await saveRoomFs(latest);
        } catch (err) {
            console.error('Failed to save room fs', { roomId: latest.roomId, err });
        }
    }, debounceMs);

    pendingSaveTimers.set(input.roomId, timer);
};
