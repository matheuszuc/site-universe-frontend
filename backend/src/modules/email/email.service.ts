import { isProduction } from "../../config/env.js";

export class EmailService {
  async sendVerificationEmail(email: string, verificationLink: string) {
    if (isProduction) {
      console.warn("TODO: configure a real email provider for verification emails.");
      return;
    }

    console.info("[dev-email] Verification email", {
      to: email,
      verificationLink
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    if (isProduction) {
      console.warn("TODO: configure a real email provider for password reset emails.");
      return;
    }

    console.info("[dev-email] Password reset email", {
      to: email,
      resetLink
    });
  }
}

export const emailService = new EmailService();
