const fs = require('fs');
const path = 'client/src/app/routes/pages/RoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const hookStr = \
  const activeLanguage = useMemo(() => {
    const ext = activePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'go': return 'go';
      case 'rs': return 'rust';
      default: return 'plaintext';
    }
  }, [activePath]);

  return (\;

content = content.replace(/\\s*return \\(\\s*<div className="bg-background text-on-surface font-body h-screen flex flex-col overflow-hidden selection:bg-primary\\/30 relative">/, hookStr + '\\n    <div className="bg-background text-on-surface font-body h-screen flex flex-col overflow-hidden selection:bg-primary/30 relative">');
content = content.replace(/defaultLanguage="typescript"/, 'language={activeLanguage}');
fs.writeFileSync(path, content, 'utf8');
