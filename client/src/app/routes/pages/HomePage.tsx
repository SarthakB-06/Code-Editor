import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function generateRoomId() {
    return crypto.randomUUID();
}

export default function HomePage() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    const trimmedRoomId = useMemo(() => roomId.trim(), [roomId]);

    return (
        <div className="p-4">
            <h1 className="text-xl font-semibold">Collaborative Editor</h1>

            <div className="mt-6 flex flex-col gap-3 max-w-md">
                <button
                    type="button"
                    className="border rounded px-3 py-2"
                    onClick={() => {
                        const newRoomId = generateRoomId();
                        navigate(`/room/${newRoomId}`);
                    }}
                >
                    Create Room
                </button>

                <div className="flex gap-2">
                    <input
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room id"
                        className="border rounded px-3 py-2 flex-1"
                    />
                    <button
                        type="button"
                        className="border rounded px-3 py-2"
                        disabled={!trimmedRoomId}
                        onClick={() => navigate(`/room/${trimmedRoomId}`)}
                    >
                        Join
                    </button>
                </div>

                <button
                    type="button"
                    className="border rounded px-3 py-2"
                    onClick={() => navigate('/auth')}
                >
                    Go to Auth
                </button>
            </div>
        </div>
    );
}
