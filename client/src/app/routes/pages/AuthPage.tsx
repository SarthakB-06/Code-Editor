import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  login,
  setAccessToken,
  signup,
} from "../../../features/auth/authService";
import { disconnectSocket } from "../../../features/collaboration/socketService";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setLoginMode = () => setMode("login");
  const setSignupMode = () => setMode("signup");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res =
        mode === "login"
          ? await login({ email, password })
          : await signup({ email, password, name });

      setAccessToken(res.token);
      disconnectSocket();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <main className="w-full max-w-[480px] z-10 mx-auto">
        {/* Ambient Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[120px]"></div>

        <div className="glass-effect rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.4)] p-8 md:p-12 border border-outline-variant/10 relative">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 flex items-center justify-center">
              <span className="text-3xl font-black tracking-tighter text-primary">
                CodeSync
              </span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight text-center">
              {mode === "login"
                ? "Sign in to CodeSync"
                : "Sign up for CodeSync"}
            </h1>
            <p className="text-on-surface-variant text-sm mt-2 font-label">
              The high-performance workspace for elite developers.
            </p>
          </div>

          <div className="space-y-3 opacity-50 cursor-not-allowed">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface text-sm font-semibold rounded-lg transition-all duration-300 border border-outline-variant/20 cursor-not-allowed"
            >
              <img
                alt="GitHub Logo"
                className="w-5 h-5 invert"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsJdN2jDOwfltzQgKTDfq9yWN44bAlK8UseeopnRBdgVOOdXAXLKaNKRGJ7Lu-A7rt5m90axMJjK8YCnL2mjRXRPkKv7b85zNvgbdG6gjGh18VSqFckZLeWeLt6pAXjbvkr2Qpr4GrKGcnJpRTPcgggCqWTS1UFCN1oGfULhiy7U6QYHWDLyRhnFKKa16qpnWz9MxlY8nnq7UvdqOaNRUOXsHbbmW3ULMskTE63gxRf9wdOTrv38FiJr7z1UafdrnocIItHDGpbOI"
              />
              <span>Continue with GitHub</span>
            </button>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface text-sm font-semibold rounded-lg transition-all duration-300 border border-outline-variant/20 cursor-not-allowed"
            >
              <img
                alt="Google Logo"
                className="w-5 h-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2YGqI2KGOBEw4PBknesDP9H4vwPh2kTxn8fAVQdHXTkyyXi3ZN-geDBRKPIKQe6b3w7dAfd8N4q0-XwCnPrqfb44U30bJIltqPhJkyXT5OfKzJ_7xcTvFtxAS_44jj3ILbAvvz4cZOqtK8HfgGKe23--BezHgMBVMg6Zfr6wZ7Oskr_mM-qZE_hhDBKpok1HYZLU90guUaYqL5MKjBgTHH6hnd9E3Z_7fpGtqYb5nntsOM0dj9D_xARntbf2ekWzm0n4wnsAMJmY"
              />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center py-8">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-on-surface-variant text-xs font-mono uppercase tracking-widest">
              or
            </span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1"
                >
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    id="name"
                    name="name"
                    placeholder="Alan Turing"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 rounded-lg px-4 py-3 transition-all duration-200 outline-none font-mono text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="dev@monolith.io"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 rounded-lg px-4 py-3 transition-all duration-200 outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                >
                  Password
                </label>
                {mode === "login" && (
                  <a
                    href="#"
                    className="text-xs font-semibold text-primary hover:text-primary-fixed-dim transition-colors"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 rounded-lg px-4 py-3 transition-all duration-200 outline-none font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm text-error bg-error-container/20 border border-error/50 rounded-lg px-4 py-3"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full kinetic-gradient bg-primary text-on-primary-container py-3.5 px-4 rounded-lg font-bold text-sm tracking-tight hover:shadow-[0_0_20px_rgba(173,198,255,0.3)] active:opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>
                  {loading
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign In"
                      : "Sign Up"}
                </span>
                {!loading && (
                  <span
                    className="material-symbols-outlined text-lg hidden"
                    style={{
                      fontVariationSettings:
                        "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    arrow_forward
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-on-surface-variant text-sm">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                type="button"
                onClick={mode === "login" ? setSignupMode : setLoginMode}
                className="text-primary font-bold hover:underline ml-1"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-4 opacity-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_4px_#4ae176]"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
              System Online
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
            v4.0.12-stable
          </span>
        </div>
      </main>

      <div className="fixed bottom-8 right-8 pointer-events-none hidden lg:block">
        <div className="text-[64px] font-black text-white/5 select-none leading-none tracking-tighter">
          IDE
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
