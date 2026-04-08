export type PublicUser = {
	id: string;
	email: string;
	name: string;
};

export type AuthResponse = {
	token: string;
	user: PublicUser;
};

const TOKEN_KEY = 'accessToken';

function getApiUrl() {
	return import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
}

export function getAccessToken() {
	return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
	localStorage.removeItem(TOKEN_KEY);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${getApiUrl()}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP_${res.status}`);
	}

	return (await res.json()) as T;
}

export async function signup(input: {
	email: string;
	password: string;
	name?: string;
}) {
	return postJson<AuthResponse>('/auth/signup', input);
}

export async function login(input: { email: string; password: string }) {
	return postJson<AuthResponse>('/auth/login', input);
}
