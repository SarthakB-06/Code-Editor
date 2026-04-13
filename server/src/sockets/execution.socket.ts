import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type CodeRunPayload, type CodeExecutionResultPayload, type User } from './events.js';
import { executeRoomCode } from '../modules/execution/execution.service.js';

type SocketData = {
    user?: User;
};

export const registerExecutionHandlers = (io: Server) => {
    const onConnection = (socket: Socket) => {
        const s = socket as Socket & { data: SocketData };

        const onCodeRun = async (payload: CodeRunPayload) => {
            const user = s.data.user;
            if (!user) return;

            const { roomId, entryPath } = payload;
            if (!roomId || !entryPath) return;

            io.to(roomId).emit(SOCKET_EVENTS.CODE_EXECUTION_START, { roomId, entryPath, triggeredBy: user.name });

            try {
                const result = await executeRoomCode(roomId, entryPath);

                const resPayload: CodeExecutionResultPayload = {
                    roomId,
                    language: result.language || 'unknown',
                    version: result.version || 'unknown',
                    runStatus: {
                        stdout: result.run?.stdout || '',
                        stderr: result.run?.stderr || '',
                        code: result.run?.code || 0,
                    }
                };

                if ('compile' in result && (result as any).compile) {
                    resPayload.compileStatus = {
                        stdout: (result as any).compile.stdout || '',
                        stderr: (result as any).compile.stderr || '',
                        code: (result as any).compile.code || 0,
                    };
                }

                io.to(roomId).emit(SOCKET_EVENTS.CODE_EXECUTION_RESULT, resPayload);
            } catch (err: any) {
                console.error('[Code Execution] Error:', err);
                io.to(roomId).emit(SOCKET_EVENTS.CODE_EXECUTION_RESULT, {
                    roomId,
                    language: 'error',
                    version: 'N/A',
                    runStatus: { stdout: '', stderr: err.message, code: 1 },
                });
            }
        };

        socket.on(SOCKET_EVENTS.CODE_RUN, onCodeRun);
    };

    io.on('connection', onConnection);
}