import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";

type AuditClient = Prisma.TransactionClient | typeof prisma;

export type AuditRequestInfo = {
  ip?: string;
  userAgent?: string;
  requestId?: string;
};

export async function recordPaymentAudit(
  client: AuditClient,
  input: {
    actorType: string;
    actorId?: string | null;
    eventType: string;
    entityType: string;
    entityId?: string | null;
    userId?: string | null;
    orderId?: string | null;
    paymentId?: string | null;
    rewardDeliveryId?: string | null;
    walletTransactionId?: string | null;
    idempotencyKey?: string | null;
    requestInfo?: AuditRequestInfo;
    success: boolean;
    reason?: string | null;
    metadata?: Prisma.InputJsonValue;
  }
) {
  return client.paymentAuditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      userId: input.userId ?? null,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      rewardDeliveryId: input.rewardDeliveryId ?? null,
      walletTransactionId: input.walletTransactionId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      requestId: input.requestInfo?.requestId ?? null,
      ipAddress: input.requestInfo?.ip ?? null,
      userAgent: input.requestInfo?.userAgent ?? null,
      success: input.success,
      reason: input.reason ?? null,
      metadata: input.metadata
    }
  });
}
