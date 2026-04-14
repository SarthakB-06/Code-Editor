const fs = require('fs');
let code = fs.readFileSync('src/app/routes/pages/RoomPage.tsx', 'utf8');

code = code.replace(
  /for \(const f of payload\.files \?\? \[\]\) \{\n\s*const p = f\.path;\n\s*paths\.push\(p\);\n\s*fileContentsRef\.current\.set\(p, f\.content \?\? ''\);\n\s*\}/,
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
      if (me) {
        providerRef.current.awareness.setLocalStateField('user', {
          name: me.name,
          color: getCursorColorIndex(me.id).toString()
        });
      }
`
);

fs.writeFileSync('src/app/routes/pages/RoomPage.tsx', code);
