import { Resend } from "resend";

import { env, isDevelopment, isProduction } from "../../config/env.js";
import { AppError } from "../../utils/safe-error.js";

type VerificationEmailInput = {
  email: string;
  verificationCode: string;
  expiresInMinutes: number;
};

function assertEmailProviderAllowed() {
  if (isProduction && env.EMAIL_PROVIDER === "console") {
    throw new Error("EMAIL_PROVIDER=console is not allowed in production.");
  }
}

// Code-only verification email. Intentionally no clickable verification link:
// in local/staging a link built from FRONTEND_URL can point to the wrong
// port/domain and fail. The manual code is the only verification path.
function buildVerificationEmail(input: VerificationEmailInput) {
  const subject = "Seu código de verificação — Site Universe";
  const text = [
    "Olá!",
    "",
    "Seu código de verificação do Site Universe é:",
    "",
    input.verificationCode,
    "",
    "Digite este código na tela de verificação do site para confirmar seu e-mail.",
    "",
    `Este código expira em ${input.expiresInMinutes} minutos.`,
    "",
    "Se você não criou uma conta no Site Universe, ignore este e-mail."
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="margin: 0 0 16px;">Seu código de verificação</h1>
      <p>Olá! Seu código de verificação do Site Universe é:</p>
      <p style="font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 24px 0;">${input.verificationCode}</p>
      <p>Digite este código na tela de verificação do site para confirmar seu e-mail.</p>
      <p>Este código expira em ${input.expiresInMinutes} minutos.</p>
      <p>Se você não criou uma conta no Site Universe, ignore este e-mail.</p>
    </div>
  `;

  return {
    subject,
    text,
    html
  };
}

function getResendErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return error instanceof Error ? error.message : "";
  }

  const maybeError = error as {
    message?: unknown;
    name?: unknown;
    statusCode?: unknown;
    status?: unknown;
  };

  return [
    maybeError.message,
    maybeError.name,
    maybeError.statusCode,
    maybeError.status
  ]
    .filter((value) => value !== undefined && value !== null)
    .join(" ");
}

function isTestingDomainRestriction(error: unknown) {
  const message = getResendErrorMessage(error).toLowerCase();

  return (
    message.includes("403") &&
    message.includes("testing") &&
    message.includes("domain")
  );
}

function handleResendError(error: unknown): never {
  if (isDevelopment && isTestingDomainRestriction(error)) {
    console.warn(
      "Com onboarding@resend.dev, envie apenas para o e-mail da conta Resend ou verifique um domínio próprio."
    );
  }

  throw new AppError(
    503,
    "SERVICE_UNAVAILABLE",
    "Não foi possível enviar o e-mail agora. Tente novamente em instantes."
  );
}

export class EmailService {
  private getResendClient() {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend.");
    }

    return new Resend(env.RESEND_API_KEY);
  }

  async sendVerificationEmail(input: VerificationEmailInput) {
    assertEmailProviderAllowed();

    if (env.EMAIL_PROVIDER === "console") {
      // Console provider is dev-only (blocked in production by
      // assertEmailProviderAllowed), so printing the code here is safe.
      console.info("[dev-email] Verification code", {
        to: input.email,
        verificationCode: input.verificationCode
      });
      return;
    }

    try {
      const message = buildVerificationEmail(input);
      const result = await this.getResendClient().emails.send({
        from: env.EMAIL_FROM,
        to: input.email,
        subject: message.subject,
        html: message.html,
        text: message.text
      });

      if (result.error) {
        handleResendError(result.error);
      }
    } catch (error) {
      handleResendError(error);
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    assertEmailProviderAllowed();

    if (env.EMAIL_PROVIDER === "console") {
      console.info("[dev-email] Password reset email", {
        to: email,
        resetLink
      });
      return;
    }

    try {
      const result = await this.getResendClient().emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Redefina sua senha no Site Universe",
        html: `
          <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
            <h1 style="margin: 0 0 16px;">Redefina sua senha</h1>
            <p>Use o link abaixo para criar uma nova senha.</p>
            <p><a href="${resetLink}">Redefinir senha</a></p>
            <p>Se voce nao solicitou a redefinicao, ignore esta mensagem.</p>
          </div>
        `,
        text: `Use o link para redefinir sua senha: ${resetLink}\n\nSe voce nao solicitou a redefinicao, ignore esta mensagem.`
      });

      if (result.error) {
        handleResendError(result.error);
      }
    } catch (error) {
      handleResendError(error);
    }
  }
}

export const emailService = new EmailService();
