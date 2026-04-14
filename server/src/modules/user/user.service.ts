import { UserModel, type UserDb } from "./user.model.js";

export const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const createDbUser = async (input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserDb> => {
  const user = await UserModel.create({
    _id: input.id,
    email: normalizeEmail(input.email),
    name: input.name.trim() || normalizeEmail(input.email),
    passwordHash: input.passwordHash,
  });

  return user.toObject() as UserDb;
};

export const findUserByEmail = async (
  email: string,
): Promise<UserDb | null> => {
  return await UserModel.findOne({ email: normalizeEmail(email) })
    .lean()
    .exec();
};

export const findUserById = async (id: string): Promise<UserDb | null> => {
  return await UserModel.findById(id).lean().exec();
};
