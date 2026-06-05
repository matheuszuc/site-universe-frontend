import { Resend } from "resend";

import { env, isDevelopment, isProduction } from "../../config/env.js";
import { AppError } from "../../utils/safe-error.js";

type VerificationEmailInput = {
  email: string;
  verificationCode: string;
  verificationLink: string;
  expiresInMinutes: number;
};

function assertEmailProviderAllowed() {
  if (isProduction && env.EMAIL_PROVIDER === "console") {
    throw new Error("EMAIL_PROVIDER=console is not allowed in production.");
  }
}

function buildVerificationEmail(input: VerificationEmailInput) {
  const subject = "Confirme seu e-mail no Site Universe";
  const text = [
    "Confirme seu e-mail no Site Universe",
    "",
    "Recebemos uma solicitacao de cadastro ou atualizacao de conta.",
    `Abra o link para confirmar: ${input.verificationLink}`,
    `Ou informe este codigo: ${input.verificationCode}`,
    `Este codigo expira em ${input.expiresInMinutes} minutos.`,
    "",
    "Se voce nao criou conta no Site Universe, ignore esta mensagem."
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h1 style="margin: 0 0 16px;">Confirme seu e-mail</h1>
      <p>Recebemos uma solicitacao de cadastro ou atualizacao de conta no Site Universe.</p>
      <p>
        <a href="${input.verificationLink}" style="display: inline-block; background: #0891b2; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Confirmar e-mail
        </a>
      </p>
      <p>Codigo de confirmacao:</p>
      <p style="font-size: 24px; font-weight: 800; letter-spacing: 4px;">${input.verificationCode}</p>
      <p>Este codigo expira em ${input.expiresInMinutes} minutos.</p>
      <p>Se voce nao criou conta no Site Universe, ignore esta mensagem.</p>
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
      console.info("[dev-email] Verification email", {
        to: input.email,
        verificationLink: input.verificationLink,
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
