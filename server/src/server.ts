import http from 'http';
import { Server, type Socket } from 'socket.io';
import 'dotenv/config';
import app from './app.js';
import { registerSockets } from './sockets/index.js';
import { socketAuthMiddleware } from './sockets/auth.middleware.js';
import { connectDb } from './config/db.js';
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to your client's domain
        methods: ['GET', 'POST'],
    },
});



const PORT = process.env.PORT || 5000;

const authGate = (socket: Socket, next: (err?: Error) => void) => {
    try {
        socketAuthMiddleware(socket);
        next();
    } catch {
        next(new Error('UNAUTHORIZED'));
    }
};

io.use(authGate);
registerSockets(io);

const bootstrap = async () => {
    await connectDb();
    const onListen = () => {
        console.log(`Server is listening on port ${PORT}`);
    };

    server.listen(PORT, onListen);
};

const onBootstrapError = (err: unknown) => {
    console.error('Failed to start server', err);
    process.exit(1);
};

bootstrap().catch(onBootstrapError);
