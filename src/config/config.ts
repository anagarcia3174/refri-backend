import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    accessTokenSecret: string;
    refreshTokenSecret: string;
}

export const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-secret-key',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key'
}

export const dbConfig = {
    mongoURL: process.env.MONGO_URL,
}