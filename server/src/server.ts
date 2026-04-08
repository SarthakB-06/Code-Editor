import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { registerSockets } from './sockets/index.js';
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to your client's domain
        methods: ['GET', 'POST'],
    },
});



const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
registerSockets(io);


server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
