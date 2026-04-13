import Editor from '@monaco-editor/react';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import type * as Monaco from 'monaco-editor';

import { getSocket } from '../../../features/collaboration/socketService';

type User = {
  id: string;
  name: string;
  color?: string;
};

type RoomFile = {
  path: string;
  content: string;
};

type Cursor = {
  lineNumber: number;
  column: number;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
};

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type TreeNode =
  | { type: 'folder'; name: string; key: string; children: TreeNode[] }
  | { type: 'file'; name: string; key: string; path: string };

const sortPaths = (paths: string[]) => {
  const next = [...paths];
  next.sort((a, b) => a.localeCompare(b));
  return next;
};

const buildTreeFromEntries = (folders: string[], files: string[]): TreeNode[] => {
  type Folder = { folders: Map<string, Folder>; files: Set<string> };
  const root: Folder = { folders: new Map(), files: new Set() };

  const normalize = (p: string) => {
    return p
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');
  };

  const addFolderPath = (folderPath: string) => {
    const normalized = normalize(folderPath);
    if (!normalized) return;
    const parts = normalized.split('/').filter(Boolean);
    let cursor = root;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]!;
      if (!cursor.folders.has(part)) cursor.folders.set(part, { folders: new Map(), files: new Set() });
      cursor = cursor.folders.get(part)!;
    }
  };

  const addFilePath = (filePath: string) => {
    const normalized = normalize(filePath);
    if (!normalized) return;
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) return;

    let cursor = root;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]!;
      const isLast = i === parts.length - 1;
      if (isLast) {
        cursor.files.add(part);
      } else {
        if (!cursor.folders.has(part)) cursor.folders.set(part, { folders: new Map(), files: new Set() });
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
        type: 'folder',
        name,
        key: `folder:${nextPrefix}`,
        children: folderToNodes(child, nextPrefix),
      });
    }

    const fileNames = Array.from(folder.files.values());
    fileNames.sort((a, b) => a.localeCompare(b));

    for (const name of fileNames) {
      const path = prefix ? `${prefix}/${name}` : name;
      nodes.push({ type: 'file', name, key: `file:${path}`, path });
    }

    return nodes;
  };

  return folderToNodes(root, '');
};

const RoomPage = () => {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Start coding...\n');
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);
  const [socketError, setSocketError] = useState<string | null>(null);

  const [activeFileByUserId, setActiveFileByUserId] = useState<Record<string, string>>({});

  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string>('main.ts');
  const [newFilePath, setNewFilePath] = useState('');
  const [renameToPath, setRenameToPath] = useState('');

  const [newFolderPath, setNewFolderPath] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [renameFolderToPath, setRenameFolderToPath] = useState('');

  const [activeRightTab, setActiveRightTab] = useState<'presence' | 'chat'>('presence');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isTerminalOpen, setIsTerminalOpen] = useState<'open' | 'closed' | 'running'>('closed');

  const fileContentsRef = useRef<Map<string, string>>(new Map());
  const activePathRef = useRef(activePath);
  const filePathsRef = useRef<string[]>(filePaths);
  const folderPathsRef = useRef<string[]>(folderPaths);
  const selectedFolderPathRef = useRef<string>(selectedFolderPath);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const cursorListenerRef = useRef<Monaco.IDisposable | null>(null);
  const cursorEmitTimerRef = useRef<number | null>(null);
  const lastCursorRef = useRef<Cursor | null>(null);
  const remoteCursorByUserIdRef = useRef<Map<string, { path: string; cursor: Cursor; user: User }>>(new Map());
  const remoteDecorationIdsRef = useRef<Map<string, string[]>>(new Map());
  const applyRemoteCursorsRafRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const applyingRemoteRef = useRef(false);
  const emitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeRightTab === 'chat') {
      window.setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, activeRightTab]);

  useEffect(() => {
    activePathRef.current = activePath;
  }, [activePath]);

  useEffect(() => {
    filePathsRef.current = filePaths;
  }, [filePaths]);

  useEffect(() => {
    folderPathsRef.current = folderPaths;
  }, [folderPaths]);

  useEffect(() => {
    selectedFolderPathRef.current = selectedFolderPath;
  }, [selectedFolderPath]);

  const shareLink = useMemo(() => {
    if (!roomId) return '';
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const handleRunCode = () => {
    if (!roomId || !activePath) return;
    setTerminalOutput('Starting execution...\n');
    setIsTerminalOpen('running');
    const socket = getSocket();
    socket.emit('code-run', { roomId, entryPath: activePath });
  };

  const setFileContent = (path: string, content: string) => {
    fileContentsRef.current.set(path, content);
  };

  const pickNextActivePath = (paths: string[], prefer?: string) => {
    const sorted = sortPaths(paths);
    if (prefer && sorted.includes(prefer)) return prefer;
    return sorted[0] ?? '';
  };

  const selectFile = (path: string) => {
    if (!path) return;
    setActivePath(path);
    setRenameToPath(path);
    setSelectedFolderPath('');
    setRenameFolderToPath('');
    const content = fileContentsRef.current.get(path) ?? '';
    applyingRemoteRef.current = true;
    setCode(content);

    if (roomId) {
      const socket = getSocket();
      socket.emit('active-file', { roomId, path });
    }
  };

  const selectFolder = (path: string) => {
    if (!path) return;
    setSelectedFolderPath(path);
    setRenameFolderToPath(path);
  };

  const handleEditorChange = (value: string | undefined) => {
    const next = value ?? '';
    setCode(next);

    if (!roomId) return;
    if (!activePath) return;
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return;
    }

    setFileContent(activePath, next);

    const socket = getSocket();

    if (emitTimerRef.current) window.clearTimeout(emitTimerRef.current);
    emitTimerRef.current = window.setTimeout(() => {
      socket.emit('code-change', { roomId, path: activePath, code: next });
    }, 150);
  };

  const getCursorColorIndex = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i += 1) {
      hash = (hash * 31 + userId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 4;
  };

  const getAccentClasses = (userId: string) => {
    const idx = getCursorColorIndex(userId);
    if (idx === 1) return { border: 'border-tertiary/40', dot: 'bg-tertiary' };
    if (idx === 2) return { border: 'border-error/40', dot: 'bg-error' };
    if (idx === 3) return { border: 'border-secondary-fixed/40', dot: 'bg-secondary-fixed' };
    return { border: 'border-primary/40', dot: 'bg-primary' };
  };

  const applyRemoteCursors = () => {
    applyRemoteCursorsRafRef.current = null;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const active = activePathRef.current;
    if (!active) return;

    const nextDecorationsByUserId = new Map<string, Monaco.editor.IModelDeltaDecoration[]>();

    for (const [userId, entry] of remoteCursorByUserIdRef.current.entries()) {
      if (entry.path !== active) continue;
      const idx = getCursorColorIndex(userId);
      const decos: Monaco.editor.IModelDeltaDecoration[] = [];

      if (entry.cursor.selection) {
        const { startLineNumber, startColumn, endLineNumber, endColumn } = entry.cursor.selection;
        if (startLineNumber !== endLineNumber || startColumn !== endColumn) {
          decos.push({
            range: new monaco.Range(startLineNumber, startColumn, endLineNumber, endColumn),
            options: {
              className: `remote-selection-${idx}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      decos.push({
        range: new monaco.Range(entry.cursor.lineNumber, entry.cursor.column, entry.cursor.lineNumber, entry.cursor.column),
        options: {
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          beforeContentClassName: `remote-cursor remote-cursor-${idx}`,
          hoverMessage: { value: entry.user.name },
        },
      });

      nextDecorationsByUserId.set(userId, decos);
    }

    const allUserIds = new Set<string>();
    for (const userId of remoteDecorationIdsRef.current.keys()) allUserIds.add(userId);
    for (const userId of nextDecorationsByUserId.keys()) allUserIds.add(userId);

    for (const userId of allUserIds) {
      const prevIds = remoteDecorationIdsRef.current.get(userId) ?? [];
      const nextDecos = nextDecorationsByUserId.get(userId) ?? [];
      const nextIds = editor.deltaDecorations(prevIds, nextDecos);
      if (nextIds.length) remoteDecorationIdsRef.current.set(userId, nextIds);
      else remoteDecorationIdsRef.current.delete(userId);
    }
  };

  const scheduleApplyRemoteCursors = () => {
    if (applyRemoteCursorsRafRef.current != null) return;
    applyRemoteCursorsRafRef.current = window.requestAnimationFrame(applyRemoteCursors);
  };

  const handleEditorMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    cursorListenerRef.current?.dispose();
    cursorListenerRef.current = editor.onDidChangeCursorSelection((e) => {
      const position = e.selection.getPosition();
      const selection = e.selection;
      if (!roomId) return;

      lastCursorRef.current = {
        lineNumber: position.lineNumber,
        column: position.column,
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        }
      };

      if (cursorEmitTimerRef.current != null) return;
      cursorEmitTimerRef.current = window.setTimeout(() => {
        cursorEmitTimerRef.current = null;
        const cursor = lastCursorRef.current;
        const path = activePathRef.current;
        if (!cursor || !roomId || !path) return;

        const socket = getSocket();
        socket.emit('cursor-move', { roomId, path, cursor });
      }, 60);
    });

    scheduleApplyRemoteCursors();
  };

  const handleFileSelectClick = (e: MouseEvent<HTMLButtonElement>) => {
    const path = e.currentTarget.dataset.path ?? '';
    selectFile(path);
  };

  const handleFolderSelectClick = (e: MouseEvent<HTMLButtonElement>) => {
    const path = e.currentTarget.dataset.folder ?? '';
    selectFolder(path);
  };

  const handleCreateFile = () => {
    if (!roomId) return;
    const trimmed = newFilePath.trim();
    if (!trimmed) return;
    const socket = getSocket();
    socket.emit('file-create', { roomId, path: trimmed });
    setNewFilePath('');
  };

  const handleCreateFolder = () => {
    if (!roomId) return;
    const trimmed = newFolderPath.trim();
    if (!trimmed) return;
    const socket = getSocket();
    socket.emit('folder-create', { roomId, path: trimmed });
    setNewFolderPath('');
  };

  const handleRenameFile = () => {
    if (!roomId) return;
    if (!activePath) return;
    const trimmed = renameToPath.trim();
    if (!trimmed || trimmed === activePath) return;
    const socket = getSocket();
    socket.emit('file-rename', { roomId, fromPath: activePath, toPath: trimmed });
  };

  const handleRenameFolder = () => {
    if (!roomId) return;
    if (!selectedFolderPath) return;
    const trimmed = renameFolderToPath.trim();
    if (!trimmed || trimmed === selectedFolderPath) return;
    const socket = getSocket();
    socket.emit('folder-rename', { roomId, fromPath: selectedFolderPath, toPath: trimmed });
  };

  const handleDeleteFile = () => {
    if (!roomId) return;
    if (!activePath) return;
    const socket = getSocket();
    socket.emit('file-delete', { roomId, path: activePath });
  };

  const handleDeleteFolder = () => {
    if (!roomId) return;
    if (!selectedFolderPath) return;
    const socket = getSocket();
    socket.emit('folder-delete', { roomId, path: selectedFolderPath });
  };

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!roomId || !chatInput.trim()) return;
    const socket = getSocket();
    socket.emit('chat-send', { roomId, text: chatInput.trim() });
    setChatInput('');
  };

  useEffect(() => {
    if (!roomId) return;

    let socket;
    try {
      socket = getSocket();
    } catch (err) {
      setSocketError(err instanceof Error ? err.message : 'Socket error');
      return;
    }

    setSocketError(null);
    socket.emit('join-room', { roomId });
    socket.emit('get-chat-history', { roomId });

    const onSocketErrorEvent = (payload: { message?: string } | string) => {
      if (typeof payload === 'string') {
        setSocketError(payload);
        return;
      }

      const msg = payload?.message;
      if (msg) setSocketError(msg);
    };

    const onRoomJoined = (payload: {
      roomId: string;
      folders: { path: string }[];
      files: RoomFile[];
      activePath: string;
      code: string;
      version: number;
      users: User[];
    }) => {
      if (payload.roomId !== roomId) return;

      const paths: string[] = [];
      fileContentsRef.current = new Map();
      for (const f of payload.files ?? []) {
        const p = f.path;
        paths.push(p);
        fileContentsRef.current.set(p, f.content ?? '');
      }

      const folderList: string[] = [];
      for (const f of payload.folders ?? []) folderList.push(f.path);
      folderList.sort((a, b) => a.localeCompare(b));

      const nextActive = pickNextActivePath(paths, payload.activePath);
      setFilePaths(sortPaths(paths));
      setFolderPaths(folderList);
      setActivePath(nextActive);
      setRenameToPath(nextActive);
      setSelectedFolderPath('');
      setRenameFolderToPath('');

      applyingRemoteRef.current = true;
      setCode(fileContentsRef.current.get(nextActive) ?? payload.code ?? '');
      setVersion(payload.version ?? 0);
      setUsers(payload.users ?? []);

      setActiveFileByUserId((prev) => ({
        ...prev,
        ...(payload.users ?? []).reduce<Record<string, string>>((acc, u) => {
          acc[u.id] = nextActive;
          return acc;
        }, {}),
      }));

      socket.emit('active-file', { roomId, path: nextActive });
    };

    const onUserJoin = (payload: { user: User }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === payload.user.id)) return prev;
        return [...prev, payload.user];
      });
    };

    const onUserLeave = (payload: { user: User }) => {
      setUsers((prev) => prev.filter((u) => u.id !== payload.user.id));
      setActiveFileByUserId((prev) => {
        const next = { ...prev };
        delete next[payload.user.id];
        return next;
      });

      remoteCursorByUserIdRef.current.delete(payload.user.id);
      if (editorRef.current) {
        const prevIds = remoteDecorationIdsRef.current.get(payload.user.id) ?? [];
        if (prevIds.length) editorRef.current.deltaDecorations(prevIds, []);
      }
      remoteDecorationIdsRef.current.delete(payload.user.id);
    };

    const onFileCreated = (payload: { roomId: string; path: string; version: number }) => {
      if (payload.roomId !== roomId) return;

      setFileContent(payload.path, '');
      setFilePaths((prev) => {
        const next = prev.includes(payload.path) ? prev : [...prev, payload.path];
        return sortPaths(next);
      });
      setVersion(payload.version);
    };

    const onFolderCreated = (payload: { roomId: string; path: string; version: number }) => {
      if (payload.roomId !== roomId) return;
      setFolderPaths((prev) => {
        if (prev.includes(payload.path)) return prev;
        const next = [...prev, payload.path];
        next.sort((a, b) => a.localeCompare(b));
        return next;
      });
      setVersion(payload.version);
    };

    const onFolderRenamed = (payload: {
      roomId: string;
      fromPath: string;
      toPath: string;
      version: number;
      folders: { fromPath: string; toPath: string }[];
      files: { fromPath: string; toPath: string }[];
    }) => {
      if (payload.roomId !== roomId) return;

      for (const f of payload.files ?? []) {
        const content = fileContentsRef.current.get(f.fromPath) ?? '';
        fileContentsRef.current.delete(f.fromPath);
        fileContentsRef.current.set(f.toPath, content);
      }

      setFilePaths((prev) => {
        const renameMap = new Map<string, string>();
        for (const f of payload.files ?? []) renameMap.set(f.fromPath, f.toPath);

        const out = new Set<string>();
        for (const p of prev) out.add(renameMap.get(p) ?? p);
        return sortPaths(Array.from(out.values()));
      });

      setFolderPaths((prev) => {
        const renameMap = new Map<string, string>();
        for (const f of payload.folders ?? []) renameMap.set(f.fromPath, f.toPath);

        const out = new Set<string>();
        for (const p of prev) out.add(renameMap.get(p) ?? p);

        const list = Array.from(out.values());
        list.sort((a, b) => a.localeCompare(b));
        return list;
      });

      if (activePathRef.current && (payload.files ?? []).some((f) => f.fromPath === activePathRef.current)) {
        const match = (payload.files ?? []).find((f) => f.fromPath === activePathRef.current);
        if (match) {
          setActivePath(match.toPath);
          setRenameToPath(match.toPath);
          applyingRemoteRef.current = true;
          setCode(fileContentsRef.current.get(match.toPath) ?? '');
        }
      }

      if (
        selectedFolderPathRef.current &&
        (payload.folders ?? []).some((f) => f.fromPath === selectedFolderPathRef.current)
      ) {
        const match = (payload.folders ?? []).find((f) => f.fromPath === selectedFolderPathRef.current);
        if (match) {
          setSelectedFolderPath(match.toPath);
          setRenameFolderToPath(match.toPath);
        }
      }

      setVersion(payload.version);
    };

    const onFolderDeleted = (payload: { roomId: string; path: string; version: number }) => {
      if (payload.roomId !== roomId) return;
      setFolderPaths((prev) => prev.filter((p) => p !== payload.path));
      if (selectedFolderPathRef.current === payload.path) {
        setSelectedFolderPath('');
        setRenameFolderToPath('');
      }
      setVersion(payload.version);
    };

    const onFileRenamed = (payload: {
      roomId: string;
      fromPath: string;
      toPath: string;
      version: number;
    }) => {
      if (payload.roomId !== roomId) return;

      const content = fileContentsRef.current.get(payload.fromPath) ?? '';
      fileContentsRef.current.delete(payload.fromPath);
      fileContentsRef.current.set(payload.toPath, content);

      setFilePaths((prev) => {
        const next: string[] = [];
        for (const p of prev) {
          if (p === payload.fromPath) next.push(payload.toPath);
          else next.push(p);
        }
        return sortPaths(next);
      });

      if (activePathRef.current === payload.fromPath) {
        setActivePath(payload.toPath);
        setRenameToPath(payload.toPath);
        applyingRemoteRef.current = true;
        setCode(content);
      }

      setVersion(payload.version);
    };

    const onFileDeleted = (payload: { roomId: string; path: string; version: number }) => {
      if (payload.roomId !== roomId) return;

      fileContentsRef.current.delete(payload.path);
      setFilePaths((prev) => {
        const next = prev.filter((p) => p !== payload.path);
        return sortPaths(next);
      });

      if (activePathRef.current === payload.path) {
        const remaining = filePathsRef.current.filter((p) => p !== payload.path);
        const nextActive = pickNextActivePath(remaining);
        setActivePath(nextActive);
        setRenameToPath(nextActive);
        applyingRemoteRef.current = true;
        setCode(fileContentsRef.current.get(nextActive) ?? '');
      }

      setVersion(payload.version);
    };

    const onCodeUpdate = (payload: {
      roomId: string;
      path: string;
      code: string;
      version: number;
      from?: string;
    }) => {
      if (payload.roomId !== roomId) return;
      setFileContent(payload.path, payload.code);
      if (payload.path === activePathRef.current) {
        applyingRemoteRef.current = true;
        setCode(payload.code);
      }
      setVersion(payload.version);
    };

    const onActiveFileUpdate = (payload: { roomId: string; path: string; user: User }) => {
      if (payload.roomId !== roomId) return;

      setActiveFileByUserId((prev) => ({ ...prev, [payload.user.id]: payload.path }));
      setUsers((prev) => {
        if (prev.some((u) => u.id === payload.user.id)) return prev;
        return [...prev, payload.user];
      });
    };

    const onCursorMove = (payload: {
      roomId: string;
      path: string;
      cursor: Cursor;
      user: User;
      from?: string;
    }) => {
      if (payload.roomId !== roomId) return;
      if (!payload.user?.id) return;

      const socketId = socket.id;
      if (socketId && payload.from && payload.from === socketId) return;

      remoteCursorByUserIdRef.current.set(payload.user.id, {
        path: payload.path,
        cursor: payload.cursor,
        user: payload.user,
      });
      scheduleApplyRemoteCursors();
    };

    const onChatMessage = (payload: ChatMessage) => {
      if (payload.roomId !== roomId) return;
      setChatMessages((prev) => [...prev, payload]);
    };

    const onChatHistory = (payload: { roomId: string; messages: ChatMessage[] }) => {
      if (payload.roomId !== roomId) return;
      setChatMessages(payload.messages || []);
    };

    const onCodeExecutionStart = (payload: { roomId: string; entryPath: string; triggeredBy: string }) => {
      if (payload.roomId !== roomId) return;
      setIsTerminalOpen('running');
      setTerminalOutput(`> Execution triggered by ${payload.triggeredBy} on ${payload.entryPath}...\n`);
    };

    const onCodeExecutionResult = (payload: {
      roomId: string;
      language: string;
      version: string;
      runStatus: { stdout: string; stderr: string; code: number };
      compileStatus?: { stdout: string; stderr: string; code: number };
    }) => {
      if (payload.roomId !== roomId) return;
      setIsTerminalOpen('open');

      let out = `--- Language: ${payload.language} (v${payload.version}) ---\n`;
      if (payload.compileStatus && payload.compileStatus.code !== 0) {
        out += `\n[Compile Error - exited with ${payload.compileStatus.code}]\n${payload.compileStatus.stderr}\n`;
      } else {
        if (payload.runStatus.stdout) {
          out += `\n[Output]\n${payload.runStatus.stdout}\n`;
        }
        if (payload.runStatus.stderr) {
          out += `\n[Error Output - exited with ${payload.runStatus.code}]\n${payload.runStatus.stderr}\n`;
        }
        if (!payload.runStatus.stdout && !payload.runStatus.stderr) {
          out += `\n[Program finished with exit code ${payload.runStatus.code} and no output]\n`;
        }
      }
      setTerminalOutput(prev => prev + out);
    };

    socket.on('room-joined', onRoomJoined);
    socket.on('user-join', onUserJoin);
    socket.on('user-leave', onUserLeave);
    socket.on('error', onSocketErrorEvent);
    socket.on('folder-created', onFolderCreated);
    socket.on('folder-renamed', onFolderRenamed);
    socket.on('folder-deleted', onFolderDeleted);
    socket.on('file-created', onFileCreated);
    socket.on('file-renamed', onFileRenamed);
    socket.on('file-deleted', onFileDeleted);
    socket.on('code-update', onCodeUpdate);
    socket.on('active-file-update', onActiveFileUpdate);
    socket.on('cursor-move', onCursorMove);
    socket.on('code-execution-start', onCodeExecutionStart);
    socket.on('code-execution-result', onCodeExecutionResult);
    socket.on('chat-message', onChatMessage);
    socket.on('chat-history', onChatHistory);

    return () => {
      socket.off('room-joined', onRoomJoined);
      socket.off('user-join', onUserJoin);
      socket.off('user-leave', onUserLeave);
      socket.off('error', onSocketErrorEvent);
      socket.off('folder-created', onFolderCreated);
      socket.off('folder-renamed', onFolderRenamed);
      socket.off('folder-deleted', onFolderDeleted);
      socket.off('file-created', onFileCreated);
      socket.off('file-renamed', onFileRenamed);
      socket.off('file-deleted', onFileDeleted);
      socket.off('code-update', onCodeUpdate);
      socket.off('active-file-update', onActiveFileUpdate);
      socket.off('cursor-move', onCursorMove);
      socket.off('code-execution-start', onCodeExecutionStart);
      socket.off('code-execution-result', onCodeExecutionResult);
      socket.off('chat-message', onChatMessage);
      socket.off('chat-history', onChatHistory);

      if (emitTimerRef.current) {
        window.clearTimeout(emitTimerRef.current);
        emitTimerRef.current = null;
      }

      if (cursorEmitTimerRef.current) {
        window.clearTimeout(cursorEmitTimerRef.current);
        cursorEmitTimerRef.current = null;
      }

      cursorListenerRef.current?.dispose();
      cursorListenerRef.current = null;

      if (applyRemoteCursorsRafRef.current != null) {
        window.cancelAnimationFrame(applyRemoteCursorsRafRef.current);
        applyRemoteCursorsRafRef.current = null;
      }
    };
  }, [roomId]);

  useEffect(() => {
    scheduleApplyRemoteCursors();
  }, [activePath]);

  const fileTree = useMemo(() => {
    return buildTreeFromEntries(folderPaths, filePaths);
  }, [folderPaths, filePaths]);

  const renderTree = (nodes: TreeNode[], depth: number): ReactNode[] => {
    const out: ReactNode[] = [];

    for (const node of nodes) {
      if (node.type === 'folder') {
        const isSelected = node.key === `folder:${selectedFolderPath}`;
        out.push(
          <div key={node.key}>
            <button
              type="button"
              data-folder={node.key.replace(/^folder:/, '')}
              onClick={handleFolderSelectClick}
              style={{ paddingLeft: (depth * 12) + 8 }}
              className={`flex items-center w-full text-left text-sm py-1.5 px-2 hover:bg-surface-variant/40 rounded transition-colors text-on-surface-variant ${isSelected ? 'bg-surface-variant/60 font-semibold' : 'font-medium'}`}
            >
              <span className="material-symbols-outlined text-sm mr-2 text-amber-500/80" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
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
            style={{ paddingLeft: (depth * 12) + 8 }}
            className={`flex items-center w-full text-left text-sm py-1.5 px-2 hover:bg-surface-variant/40 rounded transition-colors text-on-surface-variant ${isActive ? 'bg-primary/10 text-primary font-medium border-l-[3px] border-primary' : 'border-l-[3px] border-transparent'}`}
          >
            <span className="material-symbols-outlined text-sm mr-2 text-blue-400">description</span>
            {node.name}
          </button>,
        );
      }
    }

    return out;
  };

  return (
    <div className="bg-background text-on-surface font-body h-screen flex flex-col overflow-hidden selection:bg-primary/30">
      {/* TopAppBar */}
      <header className="h-12 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-primary tracking-tight">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>terminal</span>
            <span className="hidden sm:inline">Monolith</span>
          </div>
          {/* Breadcrumbs Path */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className="text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-blue-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>description</span>
              {activePath || 'No File Selected'}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[10px] text-on-surface-variant/70 uppercase">Share Link</span>
            <span className="text-xs font-mono">{shareLink || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRunCode} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary-fixed font-bold text-sm hover:brightness-110 shadow-lg shadow-primary/10 transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>play_arrow</span>
              Run
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left (File Explorer) */}
        <aside className="hidden md:flex flex-col w-60 bg-surface-container-low border-r border-outline-variant/20 shrink-0">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Explorer</span>
            </div>

            <div className="flex gap-2 pt-2">
              <input value={newFilePath} onChange={e => setNewFilePath(e.target.value)} placeholder="file.ts" className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary" />
              <button onClick={handleCreateFile} title="New File" disabled={!roomId || !newFilePath.trim()} className="p-1 hover:bg-surface-variant rounded disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">note_add</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input value={newFolderPath} onChange={e => setNewFolderPath(e.target.value)} placeholder="folder" className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary" />
              <button onClick={handleCreateFolder} title="New Folder" disabled={!roomId || !newFolderPath.trim()} className="p-1 hover:bg-surface-variant rounded disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">create_new_folder</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {fileTree.length ? renderTree(fileTree, 0) : <div className="text-xs text-on-surface-variant p-2">Empty</div>}
          </div>

          <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-2">
            {socketError && <div className="text-xs text-error">{socketError}</div>}
            <div className="flex gap-2 pb-2">
              <input
                value={selectedFolderPath ? renameFolderToPath : renameToPath}
                onChange={(e) => selectedFolderPath ? setRenameFolderToPath(e.target.value) : setRenameToPath(e.target.value)}
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary" placeholder="Rename to..." />
              <button disabled={(!activePath && !selectedFolderPath)} onClick={selectedFolderPath ? handleRenameFolder : handleRenameFile} className="px-3 py-1.5 bg-surface-variant hover:bg-surface-bright disabled:opacity-50 transition-colors rounded text-xs font-semibold cursor-pointer">Rename</button>
            </div>
            <button disabled={(!activePath && !selectedFolderPath)} onClick={selectedFolderPath ? handleDeleteFolder : handleDeleteFile} className="w-full py-2 text-error font-bold text-xs rounded border border-error/20 hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Delete Selected</button>
          </div>
        </aside>

        {/* Center (Code Editor) */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative">
          <div className="flex bg-surface-container-low border-b border-outline-variant/10 h-10 items-center overflow-x-auto">
            <div className="flex h-full items-center px-4 gap-2 bg-[#0a0e14] text-primary border-t-2 border-primary cursor-pointer shrink-0">
              <span className="material-symbols-outlined text-[14px] text-blue-400">description</span>
              <span className="text-xs font-semibold">{activePath || 'Editor'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative pt-4">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="typescript"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{ minimap: { enabled: false } }}
            />
          </div>

          {/* Terminal / Output Panel */}
          {isTerminalOpen !== 'closed' && (
            <div className="h-56 bg-surface-container border-t border-outline-variant/20 flex flex-col shrink-0">
              <div className="flex items-center justify-between px-4 h-8 border-b border-outline-variant/10 text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  <span>Console Output {isTerminalOpen === 'running' ? '(Running...)' : ''}</span>
                </div>
                <button onClick={() => setIsTerminalOpen('closed')} className="hover:text-error transition-colors p-1">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-[#e5e5e5] whitespace-pre-wrap selection:bg-primary/30">
                {terminalOutput || 'No output.'}
              </div>
            </div>
          )}
        </section>

        {/* Right (Collaboration & Chat) */}
        <aside className="hidden xl:flex flex-col w-72 bg-surface-container border-l border-outline-variant/20">
          <div className="flex border-b border-outline-variant/20 h-10 shrink-0">
            <button
              onClick={() => setActiveRightTab('presence')}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-colors ${activeRightTab === 'presence' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/20'}`}
            >
              <span className="material-symbols-outlined text-lg">group</span>
              PRESENCE
            </button>
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-colors ${activeRightTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/20'}`}
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              CHAT
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeRightTab === 'presence' ? (
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  <span>{users.length} Active Users</span>
                </div>

                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-high/50 border border-outline-variant/10 hover:border-outline-variant/30 transition-all cursor-pointer">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full border-2 ${getAccentClasses(u.id).border} flex items-center justify-center bg-surface uppercase font-bold text-lg text-primary`}>{u.name[0]}</div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getAccentClasses(u.id).dot} border-2 border-surface-container rounded-full animate-pulse`}></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-on-surface truncate">{u.name}</div>
                        <div className="text-[10px] text-on-surface-variant truncate">{activeFileByUserId[u.id] ? `Editing: ${activeFileByUserId[u.id]}` : 'Online'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-2">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">System Info</span>
                  <p className="text-[9px] text-on-surface-variant leading-tight">Version: <span className="text-primary">{version}</span></p>
                  <p className="text-[9px] text-on-surface-variant leading-tight overflow-hidden text-ellipsis selection:bg-primary/50">Room: {roomId}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-surface-container-low/30">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                      <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                      <p className="text-xs">No messages yet</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-primary">{msg.senderName}</span>
                          <span className="text-[9px] text-on-surface-variant opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <form onSubmit={handleSendChat} className="p-3 border-t border-outline-variant/20 bg-surface-container">
                  <div className="flex bg-surface-container-high border border-outline-variant/30 rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-on-surface focus:outline-none"
                    />
                    <button type="submit" disabled={!chatInput.trim()} className="px-3 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default RoomPage;
