import { createHmac, timingSafeEqual } from "node:crypto";

import { env, isDevelopment } from "../../../config/env.js";
import { AppError } from "../../../utils/safe-error.js";

type CreatePixPaymentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  payerEmail: string;
  expiresAt: Date | null;
  idempotencyKey: string;
};

// Normalized payment status used across the app, independent of provider vocabulary.
// pending = aguardando, approved = Pix pago/confirmado, expired = cobranca expirada.
type NormalizedStatus = "pending" | "approved" | "expired" | "unknown" | "not_found";

type OpenPixCharge = {
  correlationID?: string;
  status?: string;
  value?: number;
  identifier?: string;
  globalID?: string;
  transactionID?: string;
  brCode?: string;
  qrCodeImage?: string;
  paymentLinkID?: string;
  expiresDate?: string;
};

type OpenPixChargeResponse = {
  charge?: OpenPixCharge;
  brCode?: string;
};

type OpenPixProviderOrder = {
  providerPaymentId: string;
  providerTransactionId: string | null;
  status: NormalizedStatus;
  statusDetail: string | null;
  amountCents: number | null;
  currency: string | null;
  externalReference: string | null;
};

const openPixProvider = "openpix";
const chargeEndpointPath = "/api/v1/charge";

function getMissingOpenPixConfig() {
  const missing: string[] = [];

  if (!env.OPENPIX_APP_ID) {
    missing.push("OPENPIX_APP_ID");
  }

  if (!env.OPENPIX_BASE_URL) {
    missing.push("OPENPIX_BASE_URL");
  }

  return missing;
}

function logMissingOpenPixConfig(missing: string[]) {
  if (!isDevelopment || missing.length === 0) {
    return;
  }

  // Never log credential values, only which keys are absent.
  console.warn("OpenPix Pix charge creation disabled", {
    missing,
    hasAppId: Boolean(env.OPENPIX_APP_ID),
    openPixEnv: env.OPENPIX_ENV
  });
}

async function logOpenPixError(context: string, response: Response) {
  if (!isDevelopment) {
    return;
  }

  let body: unknown = null;
  const text = await response.text().catch(() => "");

  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { message: text.slice(0, 500) };
    }
  }

  // Status + safe error message only; the AppID is never included.
  console.error("OpenPix request failed", {
    context,
    status: response.status,
    error: pickOpenPixErrorFields(body)
  });
}

function pickOpenPixErrorFields(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;

  return {
    error: record.error,
    message: record.message
  };
}

// OpenPix charge.status -> normalized internal status.
// ACTIVE/OVERDUE = aguardando, COMPLETED/CONFIRMED/PAID = pago, EXPIRED = expirado.
function normalizeStatus(status: string | undefined): NormalizedStatus {
  switch ((status ?? "").toUpperCase()) {
    case "COMPLETED":
    case "CONFIRMED":
    case "PAID":
      return "approved";
    case "ACTIVE":
    case "OVERDUE":
      return "pending";
    case "EXPIRED":
      return "expired";
    default:
      return "unknown";
  }
}

function getQrCodeImage(qrCodeImage: string | undefined) {
  if (!qrCodeImage) {
    return null;
  }

  return qrCodeImage;
}

function parseExpiresDate(expiresDate: string | undefined, fallback: Date | null) {
  if (!expiresDate) {
    return fallback;
  }

  const parsed = new Date(expiresDate);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function authHeaders(extra: Record<string, string> = {}) {
  // OpenPix/Woovi authenticate with the AppID passed directly in Authorization.
  return {
    Authorization: env.OPENPIX_APP_ID ?? "",
    "Content-Type": "application/json",
    ...extra
  };
}

export class OpenPixPixService {
  get provider() {
    return openPixProvider;
  }

  isEnabled() {
    return env.PAYMENT_PROVIDER === "openpix" && getMissingOpenPixConfig().length === 0;
  }

  isWebhookEnabled() {
    // The webhook is accepted even without a shared secret because approval always
    // re-queries OpenPix server-to-server. The secret only adds HMAC pre-validation.
    return this.isEnabled();
  }

  hasWebhookSecret() {
    return Boolean(env.OPENPIX_WEBHOOK_SECRET);
  }

  async createPixPayment(input: CreatePixPaymentInput) {
    const missingConfig = getMissingOpenPixConfig();

    if (missingConfig.length > 0) {
      logMissingOpenPixConfig(missingConfig);
      return null;
    }

    if (input.currency !== "BRL") {
      throw new AppError(400, "BAD_REQUEST", "Moeda indisponível para Pix.");
    }

    const expiresInSeconds = input.expiresAt
      ? Math.max(60, Math.round((input.expiresAt.getTime() - Date.now()) / 1000))
      : undefined;
    const response = await fetch(`${env.OPENPIX_BASE_URL}${chargeEndpointPath}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        // correlationID is our internal orderNumber: stable, unique, and used to
        // reconcile webhooks back to the local order without trusting the client.
        correlationID: input.orderNumber,
        value: input.amountCents,
        comment: `Site Universe ${input.orderNumber}`,
        ...(expiresInSeconds ? { expiresIn: expiresInSeconds } : {})
      })
    });

    if (!response.ok) {
      await logOpenPixError("create_charge", response);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const payload = (await response.json()) as OpenPixChargeResponse;
    const charge = payload.charge ?? {};
    const providerPaymentId = charge.identifier ?? charge.correlationID ?? input.orderNumber;

    return {
      providerPaymentId,
      providerTransactionId: charge.transactionID ?? charge.globalID ?? null,
      status: normalizeStatus(charge.status),
      statusDetail: charge.status ?? null,
      pixCopiaECola: charge.brCode ?? payload.brCode ?? null,
      qrCodeImage: getQrCodeImage(charge.qrCodeImage),
      expiresAt: parseExpiresDate(charge.expiresDate, input.expiresAt)
    };
  }

  async getProviderOrder(providerOrderId: string): Promise<OpenPixProviderOrder> {
    if (!this.isEnabled()) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    // OpenPix accepts either the charge identifier or the correlationID here.
    const response = await fetch(
      `${env.OPENPIX_BASE_URL}${chargeEndpointPath}/${encodeURIComponent(providerOrderId)}`,
      {
        headers: authHeaders()
      }
    );

    if (response.status === 404) {
      return {
        providerPaymentId: providerOrderId,
        providerTransactionId: null,
        status: "not_found",
        statusDetail: null,
        amountCents: null,
        currency: null,
        externalReference: null
      };
    }

    if (!response.ok) {
      await logOpenPixError("get_charge", response);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const payload = (await response.json()) as OpenPixChargeResponse;
    const charge = payload.charge ?? {};

    return {
      providerPaymentId: charge.identifier ?? providerOrderId,
      providerTransactionId: charge.transactionID ?? charge.globalID ?? null,
      status: normalizeStatus(charge.status),
      statusDetail: charge.status ?? null,
      amountCents: typeof charge.value === "number" ? charge.value : null,
      currency: typeof charge.value === "number" ? "BRL" : null,
      externalReference: charge.correlationID ?? null
    };
  }

  // Optional HMAC pre-validation. OpenPix signs the raw body with the configured
  // secret and sends it in `x-openpix-signature` (base64). When no secret is set we
  // skip this and rely entirely on the server-to-server re-query for authenticity.
  validateWebhookSignature(rawBody: string, signatureHeader: string | undefined) {
    if (!env.OPENPIX_WEBHOOK_SECRET) {
      return;
    }

    if (!signatureHeader) {
      throw new AppError(403, "FORBIDDEN", "Assinatura inválida.");
    }

    const expected = createHmac("sha256", env.OPENPIX_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("base64");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signatureHeader);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new AppError(403, "FORBIDDEN", "Assinatura inválida.");
    }
  }
}

export const openPixPixService = new OpenPixPixService();
