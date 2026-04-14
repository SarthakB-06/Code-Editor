import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const trimmedRoomId = useMemo(() => roomId.trim(), [roomId]);

  const handleJoinRoom = () => {
    navigate(`/room/${trimmedRoomId}`);
  };

  const handleCreateNew = () => {
    navigate("/");
  };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col relative overflow-hidden">
      {/* TopNavBar */}
      <nav className="bg-surface-container font-['Inter'] tracking-tight flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 border-b border-outline-variant/20">
        <div className="text-xl font-bold tracking-tighter text-primary">
          Kinetic Monolith
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 text-primary font-semibold hover:text-primary-fixed transition-colors duration-200"
          >
            Authentication
          </button>
        </div>
      </nav>

      {/* Abstract Background Detail */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary rounded-full blur-[120px]"></div>
      </div>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6 relative z-10 w-full max-w-[520px] mx-auto">
        <div className="w-full glass-effect rounded-xl p-10 border border-outline-variant/15 flex flex-col justify-center shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3 leading-tight">
              Enter Workspace
            </h1>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-sm mx-auto">
              Paste a room ID to start collaborating in real-time.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/70 pl-1">
                Room Identifier
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-highest border-none rounded-md px-5 py-4 font-mono text-lg text-primary placeholder:text-outline/40 focus:ring-0 focus:outline-none transition-all duration-300"
                  placeholder="e.g. ROOM-X1-J9"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && trimmedRoomId) {
                      handleJoinRoom();
                    }
                  }}
                />
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-500 shadow-[0_4px_12px_rgba(173,198,255,0.4)]"></div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <button
                disabled={!trimmedRoomId}
                onClick={handleJoinRoom}
                className="w-full kinetic-gradient text-on-primary-container font-bold py-4 rounded-md transition-all duration-300 hover:scale-[1.02] active:opacity-80 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Join Room</span>
                <span
                  className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform"
                  style={{
                    fontVariationSettings:
                      "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  arrow_forward
                </span>
              </button>

              <div className="text-center mt-2">
                <button
                  onClick={handleCreateNew}
                  className="text-primary hover:text-primary-fixed text-sm font-semibold transition-colors duration-200"
                >
                  Create a New Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/15 w-full py-6 px-6 flex flex-col md:flex-row justify-between items-center gap-4 z-10 mt-auto">
        <div className="text-primary font-black tracking-widest text-sm uppercase">
          Kinetic Monolith
        </div>
        <div className="text-on-surface-variant font-['Inter'] text-xs uppercase tracking-widest text-center">
          © 2026 Kinetic Monolith. Engineered for flow.
        </div>
        <div className="flex items-center gap-6">
          <span className="text-on-surface-variant text-xs uppercase tracking-widest">
            v4.0.12-stable
          </span>
        </div>
      </footer>
    </div>
  );
};

export default JoinRoomPage;
