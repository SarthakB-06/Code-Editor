const fs = require('fs');
let code = fs.readFileSync('src/app/routes/pages/RoomPage.tsx', 'utf8');

// 1. Add imports 
if(!code.includes('import * as Y from "yjs";')) {
  code = code.replace(
    'import { getCursorColorIndex } from "../../../utils/colors";',
    'import { getCursorColorIndex } from "../../../utils/colors";\nimport * as Y from "yjs";\nimport { MonacoBinding } from "y-monaco";\nimport { SocketIoProvider } from "../../../features/editor/SocketIoProvider";'
  );
}

// 2. Add provider refs
if(!code.includes('const providerRef = useRef<SocketIoProvider | null>(null);')) {
  code = code.replace(
    'const monacoRef = useRef<typeof Monaco | null>(null);',
    'const monacoRef = useRef<typeof Monaco | null>(null);\n  const providerRef = useRef<SocketIoProvider | null>(null);\n  const bindingRef = useRef<MonacoBinding | null>(null);'
  );
}

// 3. Update activePath tracking
code = code.replace(
  '  useEffect(() => {\n    activePathRef.current = activePath;\n  }, [activePath]);',
  '  useEffect(() => {\n    activePathRef.current = activePath;\n    if(providerRef.current && editorRef.current) {\n      if(bindingRef.current) { bindingRef.current.destroy(); bindingRef.current = null; }\n      const model = editorRef.current.getModel();\n      if(model) {\n        bindingRef.current = new MonacoBinding(providerRef.current.doc.getText(activePath), model, new Set([editorRef.current]), providerRef.current.awareness);\n      }\n    }\n  }, [activePath]);'
);

// 4. Update the room join block
code = code.replace(
  /for \(const f of payload\.files \?\? \[\]\) \{\n        const p = f\.path;\n        paths\.push\(p\);\n        fileContentsRef\.current\.set\(p, f\.content \?\? ""\);\n      \}/,
  `for (const f of payload.files ?? []) {
        const p = f.path;
        paths.push(p);
        fileContentsRef.current.set(p, f.content ?? "");
      }
      
      const doc = new Y.Doc();
      if ((payload as any).yjsState) {
        Y.applyUpdate(doc, new Uint8Array((payload as any).yjsState));
      }
      
      if (providerRef.current) providerRef.current.destroy();
      
      const rootSocket = getSocket();
      providerRef.current = new SocketIoProvider(rootSocket as any, roomId, doc);
      
      const me = payload.users.find(u => u.id === rootSocket.id);
      if(me) {
        providerRef.current.awareness.setLocalStateField('user', {
          name: me.name,
          color: getCursorColorIndex(me.id).toString()
        });
      }
`
);

// 5. Unbind on changes
code = code.replace(
  /onChange=\{handleEditorChange\}/,
  'onChange={() => {/* y-monaco handles code sync directly */}}'
);

// 6. Fix disconnect cleanup
code = code.replace(
  '      if (applyRemoteCursorsRafRef.current != null) {\n        window.cancelAnimationFrame(applyRemoteCursorsRafRef.current);\n        applyRemoteCursorsRafRef.current = null;\n      }',
  `      if (applyRemoteCursorsRafRef.current != null) {
        window.cancelAnimationFrame(applyRemoteCursorsRafRef.current);
        applyRemoteCursorsRafRef.current = null;
      }
      if (bindingRef.current) { bindingRef.current.destroy(); bindingRef.current = null; }
      if (providerRef.current) { providerRef.current.destroy(); providerRef.current = null; }`
);

fs.writeFileSync('src/app/routes/pages/RoomPage.tsx', code);
console.log('CRDT Script run completely');
