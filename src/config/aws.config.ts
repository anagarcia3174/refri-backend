import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import dotenv from 'dotenv';

dotenv.config();

interface AWSConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

export const awsConfig: AWSConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your-access-key-id',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your-secret-access-key',
    region: process.env.AWS_REGION || 'your-region'
};

const sesClient = new SESv2Client(awsConfig)

export const ses = {sesClient, SendEmailCommand}

