import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
    from: string;
    verificationLink: string;
}

export const emailConfig: EmailConfig = {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    verificationLink: process.env.VERIFICATION_LINK || 'http://localhost:3000/api/auth/verify-email'
}