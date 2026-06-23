import { timingSafeEqual } from "node:crypto";

import { env, isDevelopment } from "../../../config/env.js";
import { AppError } from "../../../utils/safe-error.js";

// Comparação de segredos em tempo constante (evita timing side-channel).
function safeStringEquals(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

type CreatePixPaymentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  payerEmail: string;
  payerName: string;
  payerCpfCnpj?: string | null;
  existingCustomerId?: string | null;
  expiresAt: Date | null;
  idempotencyKey: string;
};

// Normalized payment status used across the app, independent of provider vocabulary.
type NormalizedStatus =
  | "pending"
  | "approved"
  | "expired"
  | "cancelled"
  | "failed"
  | "unknown"
  | "not_found";

type AsaasCustomerResponse = {
  id?: string;
  errors?: Array<{ code?: string; description?: string }>;
};

type AsaasPaymentResponse = {
  id?: string;
  status?: string;
  value?: number;
  externalReference?: string | null;
  customer?: string;
  dueDate?: string;
};

type AsaasPixQrCodeResponse = {
  success?: boolean;
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

type AsaasProviderOrder = {
  providerPaymentId: string;
  providerTransactionId: string | null;
  status: NormalizedStatus;
  statusDetail: string | null;
  amountCents: number | null;
  currency: string | null;
  externalReference: string | null;
};

const asaasProvider = "asaas";

function getMissingAsaasConfig() {
  const missing: string[] = [];

  if (!env.ASAAS_ACCESS_TOKEN) {
    missing.push("ASAAS_ACCESS_TOKEN");
  }

  if (!env.ASAAS_BASE_URL) {
    missing.push("ASAAS_BASE_URL");
  }

  return missing;
}

function logMissingAsaasConfig(missing: string[]) {
  if (!isDevelopment || missing.length === 0) {
    return;
  }

  // Never log credential values, only which keys are absent.
  console.warn("Asaas Pix charge creation disabled", {
    missing,
    hasAccessToken: Boolean(env.ASAAS_ACCESS_TOKEN),
    asaasEnv: env.ASAAS_ENV
  });
}

async function readErrorFields(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    const body = JSON.parse(text) as { errors?: unknown; message?: unknown };

    // Asaas returns { errors: [{ code, description }] }; keep only safe fields.
    return {
      errors: body.errors,
      message: body.message
    };
  } catch {
    return { message: text.slice(0, 500) };
  }
}

async function logAsaasError(context: string, response: Response) {
  if (!isDevelopment) {
    return;
  }

  // Status + safe error body only; the access_token is never included.
  console.error("Asaas request failed", JSON.stringify({
    context,
    status: response.status,
    error: await readErrorFields(response)
  }, null, 2));
}

// Asaas payment.status -> normalized internal status.
function normalizeStatus(status: string | undefined): NormalizedStatus {
  switch ((status ?? "").toUpperCase()) {
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "approved";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "pending";
    case "OVERDUE":
      return "expired";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "AWAITING_CHARGEBACK_REVERSAL":
      return "failed";
    case "DELETED":
      return "cancelled";
    default:
      return "unknown";
  }
}

function toReais(amountCents: number) {
  return Number((amountCents / 100).toFixed(2));
}

function toCents(value: number | undefined) {
  return typeof value === "number" ? Math.round(value * 100) : null;
}

function buildDueDate() {
  const due = new Date();
  due.setUTCDate(due.getUTCDate() + env.ASAAS_PIX_DUE_DAYS);

  return due.toISOString().slice(0, 10);
}

function asaasHeaders(extra: Record<string, string> = {}) {
  // Asaas authenticates with the token in the `access_token` header (NOT Bearer).
  return {
    access_token: env.ASAAS_ACCESS_TOKEN ?? "",
    "Content-Type": "application/json",
    ...extra
  };
}

export class AsaasPixService {
  get provider() {
    return asaasProvider;
  }

  isEnabled() {
    return env.PAYMENT_PROVIDER === "asaas" && getMissingAsaasConfig().length === 0;
  }

  isWebhookEnabled() {
    // The webhook is accepted even without a shared token because approval always
    // re-queries Asaas server-to-server. The token only adds header pre-validation.
    return this.isEnabled();
  }

  hasWebhookToken() {
    return Boolean(env.ASAAS_WEBHOOK_TOKEN);
  }

  // Reuses an existing Asaas customer when one is known for the user; otherwise
  // creates a new one. The customer id is stored by the caller in order metadata so
  // we never create a duplicate customer per order.
  private async getOrCreateCustomer(input: CreatePixPaymentInput) {
    if (input.existingCustomerId) {
      return input.existingCustomerId;
    }

    const response = await fetch(`${env.ASAAS_BASE_URL}/customers`, {
      method: "POST",
      headers: asaasHeaders(),
      body: JSON.stringify({
        name: input.payerName,
        email: input.payerEmail,
        // Asaas REQUIRES cpfCnpj to create a customer. It is collected at checkout
        // and passed through the order; sent only when available. Not persisted.
        ...(input.payerCpfCnpj ? { cpfCnpj: input.payerCpfCnpj } : {}),
        externalReference: input.payerEmail
      })
    });

    if (!response.ok) {
      await logAsaasError("create_customer", response);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const customer = (await response.json()) as AsaasCustomerResponse;

    if (!customer.id) {
      await logAsaasError("create_customer_no_id", response);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    return customer.id;
  }

  async createPixPayment(input: CreatePixPaymentInput) {
    const missingConfig = getMissingAsaasConfig();

    if (missingConfig.length > 0) {
      logMissingAsaasConfig(missingConfig);
      return null;
    }

    if (input.currency !== "BRL") {
      throw new AppError(400, "BAD_REQUEST", "Moeda indisponível para Pix.");
    }

    const customerId = await this.getOrCreateCustomer(input);
    const chargeResponse = await fetch(`${env.ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: asaasHeaders(),
      body: JSON.stringify({
        customer: customerId,
        // PIX only. Never CREDIT_CARD/BOLETO/UNDEFINED (UNDEFINED would expose
        // multiple payment methods on the invoice).
        billingType: "PIX",
        value: toReais(input.amountCents),
        dueDate: buildDueDate(),
        // externalReference is our internal orderNumber: used to reconcile webhooks
        // back to the local order without trusting the client.
        externalReference: input.orderNumber,
        description: `Site Universe ${input.orderNumber}`
      })
    });

    if (!chargeResponse.ok) {
      await logAsaasError("create_charge", chargeResponse);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const charge = (await chargeResponse.json()) as AsaasPaymentResponse;

    if (!charge.id) {
      await logAsaasError("create_charge_no_id", chargeResponse);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const pix = await this.getPixQrCode(charge.id);

    return {
      providerPaymentId: charge.id,
      providerTransactionId: null,
      status: normalizeStatus(charge.status),
      statusDetail: charge.status ?? null,
      pixCopiaECola: pix?.payload ?? null,
      qrCodeImage: pix?.encodedImage ? `data:image/png;base64,${pix.encodedImage}` : null,
      expiresAt: parseExpiration(pix?.expirationDate, input.expiresAt),
      asaasCustomerId: customerId
    };
  }

  async getPixQrCode(paymentId: string) {
    const response = await fetch(
      `${env.ASAAS_BASE_URL}/payments/${encodeURIComponent(paymentId)}/pixQrCode`,
      {
        headers: asaasHeaders()
      }
    );

    if (!response.ok) {
      await logAsaasError("get_pix_qrcode", response);
      // QR code is best-effort: the order is already created and the user can retry
      // via the status endpoint. Do not fail the whole order creation here.
      return null;
    }

    return (await response.json()) as AsaasPixQrCodeResponse;
  }

  async getProviderOrder(providerPaymentId: string): Promise<AsaasProviderOrder> {
    if (!this.isEnabled()) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const response = await fetch(
      `${env.ASAAS_BASE_URL}/payments/${encodeURIComponent(providerPaymentId)}`,
      {
        headers: asaasHeaders()
      }
    );

    if (response.status === 404) {
      return {
        providerPaymentId,
        providerTransactionId: null,
        status: "not_found",
        statusDetail: null,
        amountCents: null,
        currency: null,
        externalReference: null
      };
    }

    if (!response.ok) {
      await logAsaasError("get_charge", response);
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const charge = (await response.json()) as AsaasPaymentResponse;
    const amountCents = toCents(charge.value);

    return {
      providerPaymentId: charge.id ?? providerPaymentId,
      providerTransactionId: null,
      status: normalizeStatus(charge.status),
      statusDetail: charge.status ?? null,
      amountCents,
      currency: amountCents !== null ? "BRL" : null,
      externalReference: charge.externalReference ?? null
    };
  }

  // Asaas authenticates webhooks via the `asaas-access-token` header, whose value is
  // the token you configure in the Asaas panel. We compare it to ASAAS_WEBHOOK_TOKEN.
  validateWebhookToken(receivedToken: string | undefined) {
    if (!env.ASAAS_WEBHOOK_TOKEN) {
      return;
    }

    // Public response must stay generic (never reveal the token/header/mechanism).
    // Internal log records only the reason — never the received value or the secret.
    if (!receivedToken) {
      console.warn("asaas webhook rejected", { reason: "missing_token" });
      throw new AppError(403, "FORBIDDEN", "Acesso negado.");
    }

    if (!safeStringEquals(receivedToken, env.ASAAS_WEBHOOK_TOKEN)) {
      console.warn("asaas webhook rejected", { reason: "invalid_token" });
      throw new AppError(403, "FORBIDDEN", "Acesso negado.");
    }
  }
}

function parseExpiration(expirationDate: string | undefined, fallback: Date | null) {
  if (!expirationDate) {
    return fallback;
  }

  const parsed = new Date(expirationDate);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export const asaasPixService = new AsaasPixService();
