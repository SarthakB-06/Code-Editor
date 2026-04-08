import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { roomId } = useParams();

  const shareLink = useMemo(() => {
    if (!roomId) return '';
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Room</h1>
      <div className="mt-2 text-sm opacity-80">Room ID: {roomId ?? '—'}</div>

      <div className="mt-4">
        <div className="text-sm font-medium">Invite link</div>
        <div className="mt-1 text-sm break-all select-all border rounded p-2">
          {shareLink || '—'}
        </div>
      </div>

      <div className="mt-6 text-sm opacity-80">
        Monaco editor + file explorer will render here.
      </div>
    </div>
  );
}
