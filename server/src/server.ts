import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import app from './app.js';
import { registerSockets } from './sockets/index.js';
import { socketAuthMiddleware } from './sockets/auth.middleware.js';
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to your client's domain
        methods: ['GET', 'POST'],
    },
});



const PORT = process.env.PORT || 5000;
io.use((socket, next) => {
    try {
        socketAuthMiddleware(socket);
        next();
    } catch {
        next(new Error('UNAUTHORIZED'));
    }
});
registerSockets(io);


server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
