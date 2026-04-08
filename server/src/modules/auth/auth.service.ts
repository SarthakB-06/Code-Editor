import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
};

export type PublicUser = Omit<AuthUser, 'passwordHash'>;

export type JwtPayload = {
    sub: string;
    email: string;
    name: string;
};

const usersByEmail = new Map<string, AuthUser>();
const usersById = new Map<string, AuthUser>();

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length > 0) return secret;
    // Dev fallback so the app works out-of-the-box.
    return 'dev-secret-change-me';
}

export function signAccessToken(payload: JwtPayload) {
    return jwt.sign(payload, getJwtSecret(), {
        algorithm: 'HS256',
        expiresIn: '7d',
    });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256'],
    }) as JwtPayload;
}

export async function createUser(input: {
    id: string;
    email: string;
    name: string;
    password: string;
}): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    if (usersByEmail.has(email)) {
        throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user: AuthUser = {
        id: input.id,
        email,
        name: input.name.trim() || email,
        passwordHash,
    };

    usersByEmail.set(email, user);
    usersById.set(user.id, user);

    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
}

export async function validateUserLogin(input: {
    email: string;
    password: string;
}): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const user = usersByEmail.get(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
}

export function getUserById(id: string): PublicUser | null {
    const user = usersById.get(id);
    if (!user) return null;
    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
}
