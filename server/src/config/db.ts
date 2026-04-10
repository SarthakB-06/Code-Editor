import mongoose from 'mongoose';

export const connectDb = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('Missing MONGO_URI in environment');
    }

    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(mongoUri);
};
