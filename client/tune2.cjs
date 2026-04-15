const fs = require('fs');
const path = 'client/src/app/routes/pages/RoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace indent size
content = content.replace(/style={{ paddingLeft: \\(depth \* 12\\) \+ 8 }}/g, 'style={{ paddingLeft: (depth * 20) + 8 }}');

fs.writeFileSync(path, content, 'utf8');
