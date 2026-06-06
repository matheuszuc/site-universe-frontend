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

type MercadoPagoOrderResponse = {
  id?: string;
  total_amount?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      amount?: string;
      payment_method?: {
        id?: string;
        type?: string;
        ticket_url?: string;
        qr_code?: string;
        qr_code_base64?: string;
      };
    }>;
  };
};

type MercadoPagoErrorLogContext = {
  response: Response;
  transactionAmount: number;
  hasPayerEmail: boolean;
  usingTestPayerEmail: boolean;
  payerEmailDomain: string | null;
};

type MercadoPagoProviderOrder = {
  providerPaymentId: string;
  providerTransactionId: string | null;
  status: string;
  statusDetail: string | null;
  amountCents: number | null;
  currency: string | null;
  externalReference: string | null;
  siteUniversePaymentId: string | null;
  siteUniverseOrderId: string | null;
};

type MercadoPagoPixTransaction = NonNullable<
  NonNullable<MercadoPagoOrderResponse["transactions"]>["payments"]
>[number];

type SignatureValidationInput = {
  dataId: string;
  xRequestId?: string;
  xSignature?: string;
};

const mercadoPagoApiBaseUrl = "https://api.mercadopago.com";
const mercadoPagoOrdersEndpoint = `${mercadoPagoApiBaseUrl}/v1/orders`;
const mercadoPagoPixProvider = "mercado_pago_pix";

function getMissingMercadoPagoPaymentConfig() {
  const missing: string[] = [];

  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    missing.push("MERCADO_PAGO_ACCESS_TOKEN");
  }

  if (env.MERCADO_PAGO_ENV !== "sandbox") {
    missing.push("MERCADO_PAGO_ENV");
  }

  return missing;
}

function logMissingMercadoPagoPaymentConfig(missing: string[]) {
  if (!isDevelopment || missing.length === 0) {
    return;
  }

  console.warn("Mercado Pago Pix order creation disabled", {
    missing,
    hasAccessToken: Boolean(env.MERCADO_PAGO_ACCESS_TOKEN),
    mercadoPagoEnv: env.MERCADO_PAGO_ENV
  });
}

async function parseMercadoPagoErrorBody(response: Response) {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return {
      message: body.slice(0, 1000)
    };
  }
}

function pickMercadoPagoErrorFields(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;

  return {
    error: record.error,
    message: record.message,
    cause: record.cause
  };
}

async function logMercadoPagoOrderError(input: MercadoPagoErrorLogContext) {
  const errorBody = await parseMercadoPagoErrorBody(input.response);

  if (!isDevelopment) {
    return;
  }

  console.error("Mercado Pago Pix order request failed", {
    status: input.response.status,
    endpoint: mercadoPagoOrdersEndpoint,
    total_amount: input.transactionAmount,
    hasPayerEmail: input.hasPayerEmail,
    usingTestPayerEmail: input.usingTestPayerEmail,
    payerEmailDomain: input.payerEmailDomain,
    hasAccessToken: Boolean(env.MERCADO_PAGO_ACCESS_TOKEN),
    response: pickMercadoPagoErrorFields(errorBody)
  });
}

function parseSignatureHeader(signature: string) {
  return signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, rawValue] = part.split("=");

    if (rawKey && rawValue) {
      acc[rawKey.trim()] = rawValue.trim();
    }

    return acc;
  }, {});
}

function normalizeDataId(dataId: string) {
  return /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
}

function safeCompareHex(expectedHex: string, receivedHex: string) {
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function getQrCodeImage(qrCodeBase64: string | undefined) {
  if (!qrCodeBase64) {
    return null;
  }

  return qrCodeBase64.startsWith("data:image")
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

function getPixPayment(order: MercadoPagoOrderResponse) {
  return order.transactions?.payments?.find(
    (payment) =>
      payment.payment_method?.id === "pix" && payment.payment_method.type === "bank_transfer"
  );
}

function parseAmountCents(amount: string | undefined) {
  if (!amount) {
    return null;
  }

  const parsedAmount = Number(amount);

  return Number.isFinite(parsedAmount) ? Math.round(parsedAmount * 100) : null;
}

function getPayerEmailDomain(email: string) {
  const atIndex = email.lastIndexOf("@");

  return atIndex === -1 ? null : email.slice(atIndex + 1);
}

function getPixPayerEmail(input: CreatePixPaymentInput) {
  const testPayerEmail =
    env.MERCADO_PAGO_ENV === "sandbox" ? env.MERCADO_PAGO_TEST_PAYER_EMAIL : undefined;

  if (testPayerEmail) {
    return {
      payerEmail: testPayerEmail,
      usingTestPayerEmail: true
    };
  }

  return {
    payerEmail: input.payerEmail.trim(),
    usingTestPayerEmail: false
  };
}

export class MercadoPagoPixService {
  get provider() {
    return mercadoPagoPixProvider;
  }

  isEnabled() {
    return getMissingMercadoPagoPaymentConfig().length === 0;
  }

  isWebhookEnabled() {
    return this.isEnabled() && Boolean(env.MERCADO_PAGO_WEBHOOK_SECRET);
  }

  async createPixPayment(input: CreatePixPaymentInput) {
    const missingConfig = getMissingMercadoPagoPaymentConfig();

    if (missingConfig.length > 0) {
      logMissingMercadoPagoPaymentConfig(missingConfig);
      return null;
    }

    if (input.currency !== "BRL") {
      throw new AppError(400, "BAD_REQUEST", "Moeda indisponível para Pix.");
    }

    const { payerEmail, usingTestPayerEmail } = getPixPayerEmail(input);

    if (!payerEmail) {
      throw new AppError(400, "BAD_REQUEST", "Sua conta precisa ter e-mail para pagar com Pix.");
    }

    const transactionAmount = Number((input.amountCents / 100).toFixed(2));
    const transactionAmountText = transactionAmount.toFixed(2);
    const response = await fetch(mercadoPagoOrdersEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.idempotencyKey
      },
      body: JSON.stringify({
        type: "online",
        total_amount: transactionAmountText,
        external_reference: input.orderNumber,
        processing_mode: "automatic",
        transactions: {
          payments: [
            {
              amount: transactionAmountText,
              payment_method: {
                id: "pix",
                type: "bank_transfer"
              },
              expiration_time: "PT30M"
            }
          ]
        },
        payer: {
          email: payerEmail
        }
      })
    });

    if (!response.ok) {
      await logMercadoPagoOrderError({
        response,
        transactionAmount,
        hasPayerEmail: Boolean(payerEmail),
        usingTestPayerEmail,
        payerEmailDomain: getPayerEmailDomain(payerEmail)
      });
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const order = (await response.json()) as MercadoPagoOrderResponse;
    const pixPayment = getPixPayment(order);
    const paymentMethod = pixPayment?.payment_method;

    return {
      providerPaymentId: order.id ? String(order.id) : null,
      providerTransactionId: pixPayment?.id ?? null,
      status: order.status ?? "action_required",
      statusDetail: order.status_detail ?? null,
      pixCopiaECola: paymentMethod?.qr_code ?? null,
      qrCodeImage: getQrCodeImage(paymentMethod?.qr_code_base64),
      expiresAt: input.expiresAt
    };
  }

  validateWebhookSignature(input: SignatureValidationInput) {
    if (!env.MERCADO_PAGO_WEBHOOK_SECRET) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    if (!input.xSignature || !input.xRequestId) {
      throw new AppError(403, "FORBIDDEN", "Assinatura inválida.");
    }

    const parts = parseSignatureHeader(input.xSignature);
    const timestamp = parts.ts;
    const receivedSignature = parts.v1;

    if (!timestamp || !receivedSignature) {
      throw new AppError(403, "FORBIDDEN", "Assinatura inválida.");
    }

    const dataId = normalizeDataId(input.dataId);
    const manifest = `id:${dataId};request-id:${input.xRequestId};ts:${timestamp};`;
    const expectedSignature = createHmac("sha256", env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex");

    if (!safeCompareHex(expectedSignature, receivedSignature)) {
      throw new AppError(403, "FORBIDDEN", "Assinatura inválida.");
    }
  }

  async getProviderOrder(providerOrderId: string): Promise<MercadoPagoProviderOrder> {
    if (!this.isEnabled()) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const response = await fetch(`${mercadoPagoOrdersEndpoint}/${encodeURIComponent(providerOrderId)}`, {
      headers: {
        Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    if (response.status === 404) {
      return {
        providerPaymentId: providerOrderId,
        providerTransactionId: null,
        status: "not_found",
        statusDetail: null,
        amountCents: null,
        currency: null,
        externalReference: null,
        siteUniversePaymentId: null,
        siteUniverseOrderId: null
      };
    }

    if (!response.ok) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Pagamento Pix indisponível no momento.");
    }

    const order = (await response.json()) as MercadoPagoOrderResponse;
    const pixPayment = getPixPayment(order);

    return {
      providerPaymentId: order.id ? String(order.id) : providerOrderId,
      providerTransactionId: pixPayment?.id ?? null,
      status: order.status ?? "unknown",
      statusDetail: order.status_detail ?? null,
      amountCents: parseAmountCents(order.total_amount ?? pixPayment?.amount),
      currency: order.total_amount || pixPayment?.amount ? "BRL" : null,
      externalReference: order.external_reference ?? null,
      siteUniversePaymentId: null,
      siteUniverseOrderId: null
    };
  }
}

export const mercadoPagoPixService = new MercadoPagoPixService();
