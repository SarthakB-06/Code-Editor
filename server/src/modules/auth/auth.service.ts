import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  createDbUser,
  findUserByEmail,
  findUserById,
} from "../user/user.service.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
};

export type PublicUser = Omit<AuthUser, "passwordHash">;

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;
  // Dev fallback so the app works out-of-the-box.
  return "dev-secret-change-me";
};

export const signAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  }) as JwtPayload;
};

export const createUser = async (input: {
  id: string;
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> => {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const user = await createDbUser({
      id: input.id,
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
    throw err;
  }
};

export const validateUserLogin = async (input: {
  email: string;
  password: string;
}): Promise<PublicUser> => {
  const user = await findUserByEmail(input.email);
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  return {
    id: user._id,
    email: user.email,
    name: user.name,
  };
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await findUserById(id);
  if (!user) return null;
  return {
    id: user._id,
    email: user.email,
    name: user.name,
  };
};
