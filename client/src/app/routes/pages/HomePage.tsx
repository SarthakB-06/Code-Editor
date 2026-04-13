import { useNavigate } from 'react-router-dom';

const generateRoomId = () => {
    return crypto.randomUUID();
};

const HomePage = () => {
    const navigate = useNavigate();

    const handleCreateRoom = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const newRoomId = generateRoomId();
        navigate(`/room/${newRoomId}`);
    };

    const handleGoAuth = () => {
        navigate('/auth');
    };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col relative overflow-hidden">
        {/* TopNavBar */}
        <nav className="bg-surface-container font-['Inter'] tracking-tight flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 border-b border-outline-variant/20">
            <div className="text-xl font-bold tracking-tighter text-primary">Kinetic Monolith</div>
            <div className="flex items-center gap-4">
                <button onClick={handleGoAuth} className="px-4 py-2 text-primary font-semibold hover:text-primary-fixed transition-colors duration-200">
                    Authentication
                </button>
            </div>
        </nav>

        {/* Abstract Background Detail */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary rounded-full blur-[120px]"></div>
        </div>

        <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6 relative z-10 w-full max-w-2xl mx-auto">
            <div className="w-full">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Initialize Workspace</h1>
                    <p className="text-on-surface-variant text-lg">Create a collaborative environment for your team.</p>
                </header>

                <div className="glass-effect rounded-xl p-8 border border-outline-variant/15 shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                    <form className="space-y-8" onSubmit={handleCreateRoom}>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary uppercase tracking-wider">Workspace Mode</label>
                            <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                                        <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>bolt</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-on-surface">Auto-Generated Secure Room ID</p>
                                        <p className="text-xs text-on-surface-variant">Your room code will be instantly generated</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-4">
                            <button 
                                type="submit"
                                className="w-full h-14 kinetic-gradient text-on-primary-container font-bold text-lg rounded-md shadow-lg shadow-primary/20 hover:scale-[1.01] active:opacity-80 transition-all flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>add_circle</span>
                                Create Workspace
                            </button>
                            <button onClick={(e) => { e.preventDefault(); navigate('/join'); }} className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors flex items-center gap-1 justify-center mt-2 group">
                                <span>I already have a room code</span>
                                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-surface border-t border-outline-variant/15 w-full py-6 px-6 flex flex-col md:flex-row justify-between items-center gap-4 z-10 mt-auto">
            <div className="text-primary font-black tracking-widest text-sm uppercase">Kinetic Monolith</div>
            <div className="text-on-surface-variant font-['Inter'] text-xs uppercase tracking-widest text-center">
                © 2026 Kinetic Monolith. Engineered for flow.
            </div>
            <div className="flex items-center gap-6">
                <span className="text-on-surface-variant text-xs uppercase tracking-widest">v4.0.12-stable</span>
            </div>
        </footer>
    </div>
  );
};

export default HomePage;
