import path from "path";
import fs from "fs/promises";
import { emailConfig } from "../config/email.config";
import { sendEmail } from "../utils/mailer";

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  displayName: string
) => {
  const verificationLink = `${emailConfig.verificationLink}?token=${verificationToken}`;
  const subject = "Verify your Refri email address";
  
  const templatePath = path.join(
    __dirname,
    "../templates/emails/verification.html"
  );
  let html = await fs.readFile(templatePath, "utf-8");

  html = html.replace("{{displayName}}", displayName);
  html = html.replace("/{{verificationLink}}/g", verificationLink);

  await sendEmail({
    to: email,
    subject,
    html,
    from: emailConfig.from,
  });
};
