const fs = require('fs');

let content = fs.readFileSync('src/app/routes/pages/RoomPage.tsx', 'utf-8');

// Imports
content = content.replace(
  'import { getCursorColorIndex } from "../../../utils/colors";',
  `import { getCursorColorIndex } from "../../../utils/colors";\nimport * as Y from "yjs";\nimport { MonacoBinding } from "y-monaco";\nimport { SocketIoProvider } from "../../../features/editor/SocketIoProvider";`
);

// Refs replacement
let refBlock = `  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const providerRef = useRef<SocketIoProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
`;

content = content.replace(
  /const editorRef = useRef<Monaco\.editor\.IStandaloneCodeEditor \| null>\(null\);[\s\S]*?const emitTimerRef = useRef<number \| null>\(null\);/m,
  refBlock
);

// Remove scheduleApplyRemoteCursors effect
content = content.replace(
  /  useEffect\(\(\) => \{\n    scheduleApplyRemoteCursors\(\);\n  \}, \[activePath\]\);\n/m,
  ""
);

// handleEditorChange simplified
content = content.replace(
  /  const handleEditorChange = \(value.*?150\);\n  \};\n/gm,
  ""
);

// applyRemoteCursors removed
content = content.replace(
  /  const applyRemoteCursors = \(\) => \{[\s\S]*?const scheduleApplyRemoteCursors = \(\) => \{.*?\};\n/gm,
  ""
);

// Editor mount replacement
content = content.replace(
  /  const handleEditorMount = \([\s\S]*?scheduleApplyRemoteCursors\(\);\n  \};\n/m,
  `  const handleEditorMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    bindEditor(activePathRef.current);
  };

  const bindEditor = (path: string) => {
    if (!editorRef.current || !providerRef.current) return;
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const ytext = providerRef.current.doc.getText(path);
    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editorRef.current]),
      providerRef.current.awareness
    );
  };
`
);

// We need to also call bindEditor when activePath changes.
content = content.replace(
  /  useEffect\(\(\) => \{\n    activePathRef\.current = activePath;\n  \}, \[activePath\]\);/g,
  `  useEffect(() => {
    activePathRef.current = activePath;
    bindEditor(activePath);
  }, [activePath]);`
);


// onRoomJoined replacement
content = content.replace(
  /const onRoomJoined = \(payload: \{[\s\S]*?socket\.emit\("active-file", \{ roomId, path: nextActive \}\);\n    \};/m,
  `const onRoomJoined = (payload: {
      roomId: string;
      folders: { path: string }[];
      files: RoomFile[];
      activePath: string;
      code: string;
      version: number;
      users: User[];
      yjsState?: Buffer;
    }) => {
      if (payload.roomId !== roomId) return;

      const paths: string[] = [];
      fileContentsRef.current = new Map();
      for (const f of payload.files ?? []) {
        const p = f.path;
        paths.push(p);
        fileContentsRef.current.set(p, f.content ?? "");
      }

      const folderList: string[] = [];
      for (const f of payload.folders ?? []) folderList.push(f.path);
      folderList.sort((a, b) => a.localeCompare(b));

      const nextActive = pickNextActivePath(paths, payload.activePath);
      setFilePaths(sortPaths(paths));
      setFolderPaths(folderList);
      setActivePath(nextActive);

      // Initialize Yjs
      const doc = new Y.Doc();
      if (payload.yjsState) {
        Y.applyUpdate(doc, new Uint8Array(payload.yjsState));
      }
      
      if (providerRef.current) providerRef.current.destroy();
      const socketObj = getSocket();
      providerRef.current = new SocketIoProvider(socketObj as any, roomId, doc);

      // Set user awareness
      const me = payload.users.find(u => u.id === socketObj.id) || { name: 'User', id: socketObj.id, color: '#ff0000' };
      providerRef.current.awareness.setLocalStateField('user', {
        name: me.name,
        color: getCursorColorIndex(me.id).toString()
      });

      setVersion(payload.version ?? 0);
      setUsers(payload.users ?? []);

      bindEditor(nextActive);

      socketObj.emit("active-file", { roomId, path: nextActive });
    };`
);


// Ensure onChange uses nothing
content = content.replace(
  /onChange=\{handleEditorChange\}/g,
  `onChange={() => {}}`
);

// Destroy provider on unmount
content = content.replace(
  /if \(applyRemoteCursorsRafRef\.current != null\) \{[\s\S]*?\}/m,
  `if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }`
);

// Remove code-update
content = content.replace(
  /const onCodeUpdate = \(payload: \{[\s\S]*?setVersion\(payload\.version\);\n    \};/m,
  `const onCodeUpdate = () => {};`
);

// Remove cursor-move
content = content.replace(
  /const onCursorMove = \(payload: \{[\s\S]*?scheduleApplyRemoteCursors\(\);\n    \};/m,
  `const onCursorMove = () => {};`
);

fs.writeFileSync('src/app/routes/pages/RoomPage.tsx', content);

console.log("DONE rewriting RoomPage");
