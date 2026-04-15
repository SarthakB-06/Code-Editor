const fs = require('fs');
const path = 'client/src/app/routes/pages/RoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<input value={newFilePath} onChange={e => setNewFilePath(e.target.value)} placeholder="file.ts"',
  '<input value={newFilePath} onChange={e => setNewFilePath(e.target.value)} placeholder={selectedFolderPath ? \In \...\\ : "file.ts"}'
).replace(
  '<input value={newFolderPath} onChange={e => setNewFolderPath(e.target.value)} placeholder="folder"',
  '<input value={newFolderPath} onChange={e => setNewFolderPath(e.target.value)} placeholder={selectedFolderPath ? \In \...\\ : "folder"}'
);

fs.writeFileSync(path, content, 'utf8');
