export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};

const TOKEN_KEY = "accessToken";

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL ?? "http://localhost:5000";
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP_${res.status}`);
  }

  return (await res.json()) as T;
};

export const signup = async (input: {
  email: string;
  password: string;
  name?: string;
}) => {
  return postJson<AuthResponse>("/auth/signup", input);
};

export const login = async (input: { email: string; password: string }) => {
  return postJson<AuthResponse>("/auth/login", input);
};
