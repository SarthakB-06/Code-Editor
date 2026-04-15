# CodeSync - Real-Time Collaborative Code Editor 🚀

CodeSync is a powerful, real-time collaborative code editor built for developers to seamlessly write, execute, and discuss code together. It features sub-millisecond cursor tracking, operational transformation for conflict-free editing, and a built-in virtual file system.

## ✨ Features
* **Real-Time Collaboration** - Conflict-free simultaneous text editing powered by CRDTs (Yjs).
* **Multi-user Presence & Cursors** - Distinct, custom live cursors with user identification and latency under 15ms.
* **Virtual File System** - Create, rename, delete, and organize files/folders with live synchronization across all connected clients.
* **Integrated Terminal & Execution** - Execute code in various languages securely and view standard output/errors in an integrated console.
* **In-Room Chat** - Built-in messaging system for active communication while coding.
* **Syntax Highlighting** - Industry-standard Monaco Editor providing VS Code-like intelligence and themes.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Monaco Editor, Yjs (y-monaco).
* **Backend:** Node.js, Express.js, Socket.IO, TypeScript.
* **Database:** MongoDB (with Mongoose).
* **Code Execution:** Remote execution environments via WebSocket events.

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB URI
* Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/CodeSync.git
   cd CodeSync
   ```

2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create exactly `.env` files in both directories.

**`server/.env`:**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_strong_secret
```

**`client/.env`:**
```env
VITE_SERVER_URL=http://localhost:5000
```

### Running Locally

You will need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Your app should now be running at [http://localhost:5173](http://localhost:5173).

## 🚀 Deployment
* **Client:** Vercel / Netlify
* **Server:** Render / Railway / Heroku

*Make sure to configure `VITE_SERVER_URL` on your frontend deployment and CORS allowed origins on your backend.*