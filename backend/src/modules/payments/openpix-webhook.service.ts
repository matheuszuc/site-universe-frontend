import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";
import { hashRequest } from "../idempotency/idempotency.utils.js";
import { ordersService } from "../orders/orders.service.js";
import { recordPaymentAudit, type AuditRequestInfo } from "./audit.service.js";
import { openPixPixService } from "./providers/openpix-pix.service.js";

type OpenPixWebhookInput = {
  event: string | null;
  correlationID: string | null;
  chargeIdentifier: string | null;
  eventId: string;
  rawBody: string;
  signature?: string;
  requestInfo?: AuditRequestInfo & {
    path?: string;
  };
};

const paymentWebhookScope = "payment_webhook";

// Only "paid"/completed charge events can ever approve an order. Anything else
// (charge created, expired, refund, test ping) updates raw status but never delivers.
const approvableEvents = new Set([
  "OPENPIX:CHARGE_COMPLETED",
  "OPENPIX:TRANSACTION_RECEIVED"
]);

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function getWebhookKey(input: OpenPixWebhookInput) {
  return `openpix:${input.eventId}`;
}

async function findInternalPayment(input: {
  correlationID: string | null;
  chargeIdentifier: string | null;
}) {
  // correlationID is our orderNumber, set by us when creating the charge — the
  // safest internal reference. Never trust amounts/status from the webhook body.
  if (input.correlationID) {
    const byOrderNumber = await prisma.payment.findFirst({
      where: {
        provider: openPixPixService.provider,
        order: {
          is: {
            orderNumber: input.correlationID
          }
        }
      },
      include: {
        order: true
      }
    });

    if (byOrderNumber) {
      return byOrderNumber;
    }
  }

  if (input.chargeIdentifier) {
    return prisma.payment.findFirst({
      where: {
        provider: openPixPixService.provider,
        providerPaymentId: input.chargeIdentifier
      },
      include: {
        order: true
      }
    });
  }

  return null;
}

export class OpenPixWebhookService {
  async handleWebhook(input: OpenPixWebhookInput) {
    openPixPixService.validateWebhookSignature(input.rawBody, input.signature);

    const idempotencyKey = getWebhookKey(input);
    const requestHash = hashRequest({
      scope: paymentWebhookScope,
      provider: openPixPixService.provider,
      event: input.event,
      correlationID: input.correlationID,
      chargeIdentifier: input.chargeIdentifier
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
          requestPath: input.requestInfo?.path ?? "/webhooks/openpix",
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

    // Events that are not a Pix payment confirmation never approve anything.
    if (input.event && !approvableEvents.has(input.event)) {
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "OPENPIX_WEBHOOK_IGNORED_EVENT",
        entityType: "payment",
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: true,
        reason: input.event,
        metadata: {
          correlationID: input.correlationID
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

    const internalPayment = await findInternalPayment(input);

    if (!internalPayment || internalPayment.provider !== openPixPixService.provider) {
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "OPENPIX_WEBHOOK_IGNORED",
        entityType: "payment",
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: false,
        reason: "payment_not_owned_by_site_universe",
        metadata: {
          correlationID: input.correlationID,
          chargeIdentifier: input.chargeIdentifier
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

    // Authoritative check: re-query OpenPix server-to-server. We never trust the
    // status/value posted in the webhook body. correlationID = our orderNumber.
    const providerOrderId =
      internalPayment.providerPaymentId ?? input.chargeIdentifier ?? internalPayment.order.orderNumber;
    const providerPayment = await openPixPixService.getProviderOrder(providerOrderId);

    if (
      providerPayment.status !== "approved" ||
      providerPayment.amountCents !== internalPayment.amountCents ||
      providerPayment.currency !== internalPayment.currency
    ) {
      await prisma.payment.update({
        where: {
          id: internalPayment.id
        },
        data: {
          rawProviderStatus: providerPayment.statusDetail ?? providerPayment.status,
          providerEventId: input.eventId,
          providerPayloadHash: hashRequest(providerPayment)
        }
      });
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "OPENPIX_WEBHOOK_NOT_APPROVED",
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
      rawProviderStatus: providerPayment.statusDetail ?? providerPayment.status,
      providerPayloadHash: hashRequest(providerPayment),
      requestId: input.requestInfo?.requestId,
      metadata: {
        provider: openPixPixService.provider,
        providerPaymentId: providerPayment.providerPaymentId,
        correlationID: providerPayment.externalReference
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

export const openPixWebhookService = new OpenPixWebhookService();
