import path from "path";
import { emailConfig } from "../config/email.config";
import { sendEmail } from "../utils/mailer.util";
import ejs from "ejs";

/**
 * Sends a verification email to the user
 * @param email - The email address to send the verification email to
 * @param verificationToken - The verification token to include in the email link
 * @param displayName - The display name of the user
 */
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  displayName: string
): Promise<void> => {
  const verificationLink = `${emailConfig.verificationLink}?token=${verificationToken}`;
  const subject = "Verify your Refri email address";
  
  const templatePath = path.join(
    __dirname,
    "views/emails/verification.ejs"
  );
  let template = await ejs.renderFile(templatePath, {displayName, verificationLink});

  await sendEmail({
    to: email,
    subject,
    template,
    from: emailConfig.from,
  });
};

/**
 * Sends a verification email to the user
 * @param email - The email address to send the verification email to
 * @param resetToken - The reset token to include in the email link
 * @param displayName - The display name of the user
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  displayName: string
): Promise<void> => {
  const resetLink = `${emailConfig.resetLink}?token=${resetToken}`;
  const subject = "Reset your Refri password";
  
  const templatePath = path.join(
    __dirname,
    "views/emails/password-reset.ejs"
  );
  let template = await ejs.renderFile(templatePath, {displayName, resetLink});

  await sendEmail({
    to: email,
    subject,
    template,
    from: emailConfig.from,
  });
};

