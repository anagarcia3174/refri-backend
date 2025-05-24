import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    accessTokenSecret: string;
    refreshTokenSecret: string;
    emailVerificationTokenSecret: string;
}

interface dbConfig {
    mongoURL: string;
}

export const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-secret-key',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
    emailVerificationTokenSecret: process.env.EMAIL_VERIFICATION_TOKEN_SECRET || 'your-email-verification-secret-key'
}

export const dbConfig: dbConfig = {
    mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/your-database-name',
}