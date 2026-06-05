import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";
import { hashRequest } from "../idempotency/idempotency.utils.js";
import { ordersService } from "../orders/orders.service.js";
import { recordPaymentAudit, type AuditRequestInfo } from "./audit.service.js";
import { mercadoPagoPixService } from "./providers/mercado-pago-pix.service.js";

type MercadoPagoWebhookInput = {
  dataId: string;
  eventId: string;
  xRequestId?: string;
  xSignature?: string;
  requestInfo?: AuditRequestInfo & {
    path?: string;
  };
};

const paymentWebhookScope = "payment_webhook";

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isApprovedPixStatus(status: string, statusDetail: string | null) {
  return status === "processed" && (!statusDetail || statusDetail === "accredited");
}

function getWebhookKey(input: MercadoPagoWebhookInput) {
  return `mercado_pago_pix:${input.eventId}:${input.dataId}`;
}

async function findInternalPayment(input: {
  siteUniversePaymentId: string | null;
  siteUniverseOrderId: string | null;
  externalReference: string | null;
  providerPaymentId: string;
}) {
  if (input.siteUniversePaymentId) {
    return prisma.payment.findUnique({
      where: {
        id: input.siteUniversePaymentId
      },
      include: {
        order: true
      }
    });
  }

  if (input.siteUniverseOrderId) {
    return prisma.payment.findFirst({
      where: {
        orderId: input.siteUniverseOrderId,
        provider: mercadoPagoPixService.provider
      },
      include: {
        order: true
      }
    });
  }

  if (input.externalReference) {
    return prisma.payment.findFirst({
      where: {
        provider: mercadoPagoPixService.provider,
        order: {
          is: {
            orderNumber: input.externalReference
          }
        }
      },
      include: {
        order: true
      }
    });
  }

  return prisma.payment.findFirst({
    where: {
      provider: mercadoPagoPixService.provider,
      providerPaymentId: input.providerPaymentId
    },
    include: {
      order: true
    }
  });
}

export class MercadoPagoWebhookService {
  async handleWebhook(input: MercadoPagoWebhookInput) {
    mercadoPagoPixService.validateWebhookSignature({
      dataId: input.dataId,
      xRequestId: input.xRequestId,
      xSignature: input.xSignature
    });

    const idempotencyKey = getWebhookKey(input);
    const requestHash = hashRequest({
      scope: paymentWebhookScope,
      provider: mercadoPagoPixService.provider,
      dataId: input.dataId,
      eventId: input.eventId
    });
    const existingIdempotency = await prisma.idempotencyKey.findUnique({
      where: {
        scope_key: {
          scope: paymentWebhookScope,
          key: idempotencyKey
        }
      }
    });

    if (existingIdempotency) {
      return {
        accepted: true,
        replay: true
      };
    }

    try {
      await prisma.idempotencyKey.create({
        data: {
          scope: paymentWebhookScope,
          key: idempotencyKey,
          requestMethod: "POST",
          requestPath: input.requestInfo?.path ?? "/webhooks/mercado-pago",
          requestHash,
          status: "processing"
        }
      });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return {
          accepted: true,
          replay: true
        };
      }

      throw error;
    }

    const providerPayment = await mercadoPagoPixService.getProviderOrder(input.dataId);
    const internalPayment = await findInternalPayment(providerPayment);

    if (!internalPayment || internalPayment.provider !== mercadoPagoPixService.provider) {
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "MERCADO_PAGO_PIX_WEBHOOK_IGNORED",
        entityType: "payment",
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: false,
        reason: "payment_not_owned_by_site_universe",
        metadata: {
          providerPaymentId: providerPayment.providerPaymentId,
          providerStatus: providerPayment.status
        }
      });
      await this.markSucceeded(idempotencyKey, {
        accepted: true,
        ignored: true
      });

      return {
        accepted: true,
        ignored: true
      };
    }

    if (
      !isApprovedPixStatus(providerPayment.status, providerPayment.statusDetail) ||
      providerPayment.amountCents !== internalPayment.amountCents ||
      providerPayment.currency !== internalPayment.currency
    ) {
      await prisma.payment.update({
        where: {
          id: internalPayment.id
        },
        data: {
          rawProviderStatus: providerPayment.status,
          providerEventId: input.eventId,
          providerPayloadHash: hashRequest(providerPayment)
        }
      });
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "MERCADO_PAGO_PIX_WEBHOOK_NOT_APPROVED",
        entityType: "payment",
        entityId: internalPayment.id,
        userId: internalPayment.userId,
        orderId: internalPayment.orderId,
        paymentId: internalPayment.id,
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: true,
        reason: providerPayment.status,
        metadata: {
          providerPaymentId: providerPayment.providerPaymentId,
          providerStatusDetail: providerPayment.statusDetail,
          amountMatches: providerPayment.amountCents === internalPayment.amountCents,
          currencyMatches: providerPayment.currency === internalPayment.currency
        }
      });
      await this.markSucceeded(idempotencyKey, {
        accepted: true,
        approved: false
      });

      return {
        accepted: true,
        approved: false
      };
    }

    const approval = await ordersService.approvePaymentFromVerifiedWebhook({
      paymentId: internalPayment.id,
      providerPaymentId: providerPayment.providerPaymentId,
      providerEventId: input.eventId,
      rawProviderStatus: providerPayment.status,
      providerPayloadHash: hashRequest(providerPayment),
      requestId: input.requestInfo?.requestId,
      metadata: {
        provider: mercadoPagoPixService.provider,
        providerPaymentId: providerPayment.providerPaymentId,
        statusDetail: providerPayment.statusDetail
      }
    });

    await this.markSucceeded(idempotencyKey, {
      accepted: true,
      approved: true,
      alreadyApproved: approval.alreadyApproved
    });

    return {
      accepted: true,
      approved: true,
      alreadyApproved: approval.alreadyApproved
    };
  }

  private async markSucceeded(key: string, responseBody: Prisma.InputJsonValue) {
    await prisma.idempotencyKey.update({
      where: {
        scope_key: {
          scope: paymentWebhookScope,
          key
        }
      },
      data: {
        status: "succeeded",
        responseStatus: 200,
        responseBody,
        lockedUntil: null
      }
    });
  }
}

export const mercadoPagoWebhookService = new MercadoPagoWebhookService();
