const fs = require('fs');
let c1 = fs.readFileSync('src/app/routes/pages/RoomPage.tsx', 'utf-8');
c1 = c1.replace(/const handleEditorChange =[\s\S]*?150\);\n  \};\n/s, '');
fs.writeFileSync('src/app/routes/pages/RoomPage.tsx', c1);

let c2 = fs.readFileSync('src/features/editor/SocketIoProvider.ts', 'utf-8');
c2 = c2.replace(/const update = import/s, 'import');
fs.writeFileSync('src/features/editor/SocketIoProvider.ts', c2);
