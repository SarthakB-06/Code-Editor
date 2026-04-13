import { getOrCreateRoomFs } from '../room/roomFs.service.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Mapping extensions to local CLI commands
const getCommand = (ext: string, filePath: string) => {
    switch (ext) {
        case 'js': return `node "${filePath}"`;
        case 'ts': return `tsx "${filePath}"`; // Switched from npx tsx to global tsx
        case 'py': return `python "${filePath}"`;
        default: return `echo "Local execution not configured for: .${ext}"`;
    }
};

export const executeRoomCode = async (roomId: string, entryPath: string) => {
    const roomFs = await getOrCreateRoomFs(roomId);
    if (!roomFs || roomFs.files.length === 0) {
        throw new Error('Room is empty or has no files.');
    }

    // Create an isolated temporary directory for the execution
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `run-${roomId}-`));

    try {
        // Write all the room's files to the temp directory
        for (const file of roomFs.files) {
            const fullPath = path.join(tmpDir, file.path);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, file.content, 'utf8');
        }

        const ext = entryPath.split('.').pop() || '';
        const entryFullPath = path.join(tmpDir, entryPath);
        const cmd = getCommand(ext, entryFullPath);

        try {
            // Execute the command locally with a strict 5-second timeout
            const { stdout, stderr } = await execAsync(cmd, {
                cwd: tmpDir,
                timeout: 5000
            });

            return {
                language: ext,
                version: 'local',
                run: { stdout, stderr, code: 0 }
            };
        } catch (error: any) {
            // Execution failed, timed out, or syntax error
            return {
                language: ext,
                version: 'local',
                run: {
                    stdout: error.stdout || '',
                    stderr: error.stderr || error.message || 'Execution error',
                    code: error.code || 1
                }
            };
        }
    } finally {
        // Wait a slight moment for processes to release locks on Windows
        await new Promise(res => setTimeout(res, 500));
        // Always properly clean up the temporary sandbox directory, ignoring lock errors
        await fs.rm(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 }).catch(console.error);
    };
}