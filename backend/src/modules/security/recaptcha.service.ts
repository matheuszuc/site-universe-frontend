import { env } from "../../config/env.js";
import { AppError } from "../../utils/safe-error.js";

type RecaptchaVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  // Presente apenas no reCAPTCHA v3 (0.0 = provavel bot, 1.0 = provavel humano).
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

const recaptchaVerifyUrl = "https://www.google.com/recaptcha/api/siteverify";

export class RecaptchaService {
  isEnabled() {
    return env.RECAPTCHA_ENABLED;
  }

  async verify(token: string | undefined): Promise<void> {
    if (!env.RECAPTCHA_ENABLED) {
      return;
    }

    if (!env.RECAPTCHA_SECRET_KEY) {
      throw new Error("RECAPTCHA_SECRET_KEY is required when RECAPTCHA_ENABLED=true");
    }

    if (!token) {
      throw new AppError(400, "RECAPTCHA_REQUIRED", "Verificação de segurança obrigatória.");
    }

    const body = new URLSearchParams({
      secret: env.RECAPTCHA_SECRET_KEY,
      response: token
    });

    let data: RecaptchaVerifyResponse;

    try {
      const response = await fetch(recaptchaVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      data = (await response.json()) as RecaptchaVerifyResponse;
    } catch {
      throw new AppError(503, "RECAPTCHA_SERVICE_UNAVAILABLE", "Erro ao verificar segurança. Tente novamente.");
    }

    if (!data.success) {
      throw new AppError(400, "RECAPTCHA_FAILED", "Verificação de segurança falhou. Tente novamente.");
    }

    // reCAPTCHA v3: alem de success, validamos o score minimo. Tokens v2 nao
    // trazem o campo "score", entao essa verificacao e ignorada para eles.
    if (typeof data.score === "number" && data.score < env.RECAPTCHA_MIN_SCORE) {
      throw new AppError(400, "RECAPTCHA_FAILED", "Verificação de segurança falhou. Tente novamente.");
    }
  }
}

export const recaptchaService = new RecaptchaService();
