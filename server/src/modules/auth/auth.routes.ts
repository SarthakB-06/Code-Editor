import { Router } from 'express';

import {
    createUser,
    signAccessToken,
    validateUserLogin,
    type JwtPayload,
} from './auth.service.js';

const router = Router();

router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body as {
            email?: string;
            password?: string;
            name?: string;
        };

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await createUser({
            id: crypto.randomUUID(),
            email,
            name: name ?? email,
            password,
        });

        const payload: JwtPayload = { sub: user.id, email: user.email, name: user.name };
        const token = signAccessToken(payload);

        return res.json({ token, user });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        if (message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        return res.status(500).json({ message: 'Failed to signup' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await validateUserLogin({ email, password });
        const payload: JwtPayload = { sub: user.id, email: user.email, name: user.name };
        const token = signAccessToken(payload);

        return res.json({ token, user });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        if (message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        return res.status(500).json({ message: 'Failed to login' });
    }
});

export default router;
