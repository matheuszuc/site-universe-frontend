import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";
import { hashRequest } from "../idempotency/idempotency.utils.js";
import { ordersService } from "../orders/orders.service.js";
import { recordPaymentAudit, type AuditRequestInfo } from "./audit.service.js";
import { asaasPixService } from "./providers/asaas-pix.service.js";

type AsaasWebhookInput = {
  event: string | null;
  externalReference: string | null;
  paymentId: string | null;
  webhookToken?: string;
  eventId: string;
  requestInfo?: AuditRequestInfo & {
    path?: string;
  };
};

const paymentWebhookScope = "payment_webhook";

// Only "money received/confirmed" events can ever approve an order. Anything else
// (created, overdue, refunded, deleted, chargeback) updates status but never delivers.
const approvableEvents = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function getWebhookKey(input: AsaasWebhookInput) {
  return `asaas:${input.eventId}`;
}

async function findInternalPayment(input: {
  externalReference: string | null;
  paymentId: string | null;
}) {
  // externalReference is our orderNumber, set by us when creating the charge — the
  // safest internal reference. Never trust amounts/status from the webhook body.
  if (input.externalReference) {
    const byOrderNumber = await prisma.payment.findFirst({
      where: {
        provider: asaasPixService.provider,
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

    if (byOrderNumber) {
      return byOrderNumber;
    }
  }

  if (input.paymentId) {
    return prisma.payment.findFirst({
      where: {
        provider: asaasPixService.provider,
        providerPaymentId: input.paymentId
      },
      include: {
        order: true
      }
    });
  }

  return null;
}

export class AsaasWebhookService {
  async handleWebhook(input: AsaasWebhookInput) {
    asaasPixService.validateWebhookToken(input.webhookToken);

    const idempotencyKey = getWebhookKey(input);
    const requestHash = hashRequest({
      scope: paymentWebhookScope,
      provider: asaasPixService.provider,
      event: input.event,
      externalReference: input.externalReference,
      paymentId: input.paymentId
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
          requestPath: input.requestInfo?.path ?? "/webhooks/asaas",
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
        eventType: "ASAAS_WEBHOOK_IGNORED_EVENT",
        entityType: "payment",
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: true,
        reason: input.event,
        metadata: {
          externalReference: input.externalReference
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

    if (!internalPayment || internalPayment.provider !== asaasPixService.provider) {
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "ASAAS_WEBHOOK_IGNORED",
        entityType: "payment",
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: false,
        reason: "payment_not_owned_by_site_universe",
        metadata: {
          externalReference: input.externalReference,
          paymentId: input.paymentId
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

    // Authoritative check: re-query Asaas server-to-server. We never trust the
    // status/value posted in the webhook body. externalReference = our orderNumber.
    const providerPaymentId =
      internalPayment.providerPaymentId ?? input.paymentId ?? "";
    const providerPayment = providerPaymentId
      ? await asaasPixService.getProviderOrder(providerPaymentId)
      : null;

    if (
      !providerPayment ||
      providerPayment.status !== "approved" ||
      providerPayment.amountCents !== internalPayment.amountCents ||
      providerPayment.currency !== internalPayment.currency
    ) {
      await prisma.payment.update({
        where: {
          id: internalPayment.id
        },
        data: {
          rawProviderStatus: providerPayment?.statusDetail ?? providerPayment?.status ?? input.event,
          providerEventId: input.eventId,
          providerPayloadHash: hashRequest(providerPayment ?? { event: input.event })
        }
      });
      await recordPaymentAudit(prisma, {
        actorType: "webhook",
        eventType: "ASAAS_WEBHOOK_NOT_APPROVED",
        entityType: "payment",
        entityId: internalPayment.id,
        userId: internalPayment.userId,
        orderId: internalPayment.orderId,
        paymentId: internalPayment.id,
        idempotencyKey,
        requestInfo: input.requestInfo,
        success: true,
        reason: providerPayment?.status ?? "no_provider_payment",
        metadata: {
          providerPaymentId: providerPayment?.providerPaymentId ?? providerPaymentId,
          amountMatches: providerPayment?.amountCents === internalPayment.amountCents,
          currencyMatches: providerPayment?.currency === internalPayment.currency
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
        provider: asaasPixService.provider,
        providerPaymentId: providerPayment.providerPaymentId,
        externalReference: providerPayment.externalReference
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

export const asaasWebhookService = new AsaasWebhookService();
