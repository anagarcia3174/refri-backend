import nodemailer from 'nodemailer';
import { ses } from '../config/aws.config';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from: string;
}

const transporter = nodemailer.createTransport({
    SES: ses
});

/**
 * Sends an email using AWS SES
 * @param options Email options including recipient, subject, HTML content, and sender
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
    const { to, subject, html, from } = options;

    const mailOptions: nodemailer.SendMailOptions = {
        from: from,
        to,
        subject,
        html,
    }

    await transporter.sendMail(mailOptions);
}