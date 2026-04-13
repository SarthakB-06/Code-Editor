import mongoose, { Schema, type Model } from 'mongoose';

export type UserDb = {
    _id: string;
    email: string;
    name: string;
    passwordHash: string;
    updatedAt: Date;
    createdAt: Date;
};

const UserSchema = new Schema<UserDb>(
    {
        _id: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        passwordHash: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

export const UserModel: Model<UserDb> =
    (mongoose.models.User as Model<UserDb>) ?? mongoose.model<UserDb>('User', UserSchema);
