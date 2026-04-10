import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { login, setAccessToken, signup } from '../../../features/auth/authService';
import { disconnectSocket } from '../../../features/collaboration/socketService';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setLoginMode = () => setMode('login');
  const setSignupMode = () => setMode('signup');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res =
        mode === 'login'
          ? await login({ email, password })
          : await signup({ email, password, name });

      setAccessToken(res.token);
      disconnectSocket();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-xl font-semibold">{mode === 'login' ? 'Login' : 'Signup'}</h1>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={setLoginMode}
        >
          Login
        </button>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={setSignupMode}
        >
          Signup
        </button>
      </div>

      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={handleSubmit}
      >
        {mode === 'signup' ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border rounded px-3 py-2"
          />
        ) : null}

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border rounded px-3 py-2"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Signup'}
        </button>

        {error ? (
          <div className="text-sm" role="alert">
            {error}
          </div>
        ) : null}
      </form>
    </div>
  );
};

export default AuthPage;
