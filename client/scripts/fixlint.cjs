const fs = require('fs');
let c1 = fs.readFileSync('src/app/routes/pages/RoomPage.tsx', 'utf-8');
c1 = c1.replace('const bindEditor = (path: string) => {', 'function bindEditor(path: string) {');
c1 = c1.replace('type { User, RoomFile, Cursor, ChatMessage } from "../../../types";', 'type { User, RoomFile, ChatMessage } from "../../../types";');
c1 = c1.replace(/const handleEditorChange(.*?)150\);\n  \};\n/s, '');
c1 = c1.replace(/  const scheduleApplyRemoteCursors = \(\) => \{\n    if \(applyRemoteCursorsRafRef\.current != null\) return;\n    applyRemoteCursorsRafRef\.current =\n      window\.requestAnimationFrame\(applyRemoteCursors\);\n  \};\n/, '');
c1 = c1.replace(/useEffect\(\(\) => \{\n    scheduleApplyRemoteCursors\(\);\n  \}, \[activePath\]\);\n/s, '');
fs.writeFileSync('src/app/routes/pages/RoomPage.tsx', c1);

let c2 = fs.readFileSync('src/features/editor/SocketIoProvider.ts', 'utf-8');
c2 = c2.replace(/origin: any/g, 'origin: unknown');
fs.writeFileSync('src/features/editor/SocketIoProvider.ts', c2);
