import Editor from '@monaco-editor/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getSocket } from '../../../features/collaboration/socketService';

type User = {
  id: string;
  name: string;
  color?: string;
};

export default function RoomPage() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Start coding...\n');
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);
  const [socketError, setSocketError] = useState<string | null>(null);

  const applyingRemoteRef = useRef(false);
  const emitTimerRef = useRef<number | null>(null);

  const shareLink = useMemo(() => {
    if (!roomId) return '';
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    let socket;
    try {
      socket = getSocket();
    } catch (err) {
      setSocketError(err instanceof Error ? err.message : 'Socket error');
      return;
    }

    setSocketError(null);
    socket.emit('join-room', { roomId });

    const onRoomJoined = (payload: {
      roomId: string;
      code: string;
      version: number;
      users: User[];
    }) => {
      if (payload.roomId !== roomId) return;
      applyingRemoteRef.current = true;
      setCode(payload.code ?? '');
      setVersion(payload.version ?? 0);
      setUsers(payload.users ?? []);
    };

    const onUserJoin = (payload: { user: User }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === payload.user.id)) return prev;
        return [...prev, payload.user];
      });
    };

    const onUserLeave = (payload: { user: User }) => {
      setUsers((prev) => prev.filter((u) => u.id !== payload.user.id));
    };

    const onCodeUpdate = (payload: {
      roomId: string;
      code: string;
      version: number;
    }) => {
      if (payload.roomId !== roomId) return;
      applyingRemoteRef.current = true;
      setCode(payload.code);
      setVersion(payload.version);
    };

    socket.on('room-joined', onRoomJoined);
    socket.on('user-join', onUserJoin);
    socket.on('user-leave', onUserLeave);
    socket.on('code-update', onCodeUpdate);

    return () => {
      socket.off('room-joined', onRoomJoined);
      socket.off('user-join', onUserJoin);
      socket.off('user-leave', onUserLeave);
      socket.off('code-update', onCodeUpdate);

      if (emitTimerRef.current) {
        window.clearTimeout(emitTimerRef.current);
        emitTimerRef.current = null;
      }
    };
  }, [roomId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Room</h1>
      <div className="mt-2 text-sm opacity-80">Room ID: {roomId ?? '—'}</div>

      <div className="mt-2 text-sm opacity-80">
        Users: {users.length} • Version: {version}
      </div>

      {socketError ? (
        <div className="mt-2 text-sm" role="alert">
          {socketError}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-sm font-medium">Invite link</div>
        <div className="mt-1 text-sm break-all select-all border rounded p-2">
          {shareLink || '—'}
        </div>
      </div>

      <div className="mt-6">
        <div className="h-[60vh] border rounded overflow-hidden">
          <Editor
            height="60vh"
            theme="vs-dark"
            defaultLanguage="typescript"
            value={code}
            onChange={(value) => {
              const next = value ?? '';
              setCode(next);

              if (!roomId) return;
              if (applyingRemoteRef.current) {
                applyingRemoteRef.current = false;
                return;
              }

              const socket = getSocket();

              if (emitTimerRef.current) window.clearTimeout(emitTimerRef.current);
              emitTimerRef.current = window.setTimeout(() => {
                socket.emit('code-change', { roomId, code: next });
              }, 150);
            }}
          />
        </div>
      </div>
    </div>
  );
}
