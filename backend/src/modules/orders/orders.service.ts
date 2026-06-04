import { randomInt } from "node:crypto";

import { Prisma } from "@prisma/client";

import { sessionCookieName } from "../../config/cookies.js";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/safe-error.js";
import { authService } from "../auth/auth.service.js";
import {
  addHours,
  addMinutes,
  getHeaderValue,
  hashRequest,
  idempotencyKeySchema
} from "../idempotency/idempotency.utils.js";
import { recordPaymentAudit, type AuditRequestInfo } from "../payments/audit.service.js";
import { userRewardCycleService } from "../rewards/reward-cycle.service.js";
import { storePackageService } from "../store/store.service.js";
import { createOrderSchema, type CreateOrderInput } from "./orders.schemas.js";

type RequestInfo = AuditRequestInfo & {
  method?: string;
  path?: string;
};

type ApprovePaymentInput = {
  paymentId: string;
  providerPaymentId?: string | null;
  providerEventId?: string | null;
  rawProviderStatus?: string | null;
  providerPayloadHash?: string | null;
  requestId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

const orderCreateScope = "order_create";
const futurePaymentProvider = "future_webhook_provider";
const approvablePaymentStatuses = new Set(["pending", "processing"]);

function buildOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomInt(100000, 999999);

  return `SU-${date}-${suffix}`;
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function getPackageCode(input: CreateOrderInput) {
  return input.packageCode ?? input.packageId ?? "";
}

function buildCreateOrderResponse(
  order: {
    id: string;
    orderNumber: string;
    status: string;
    packageCode: string;
    packageName: string;
    amountCents: number;
    currency: string;
    rewardType: string;
    rewardAmount: number;
    expiresAt: Date | null;
    createdAt: Date;
  },
  payment: {
    id: string;
    status: string;
    provider: string;
    amountCents: number;
    currency: string;
    createdAt: Date;
  }
) {
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      packageCode: order.packageCode,
      packageName: order.packageName,
      amountCents: order.amountCents,
      currency: order.currency,
      rewardType: order.rewardType,
      rewardAmount: order.rewardAmount,
      expiresAt: toIsoDate(order.expiresAt),
      createdAt: order.createdAt.toISOString()
    },
    payment: {
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
      amountCents: payment.amountCents,
      currency: payment.currency,
      createdAt: payment.createdAt.toISOString()
    }
  };
}

function isCreateOrderResponse(value: unknown): value is ReturnType<typeof buildCreateOrderResponse> {
  return Boolean(value && typeof value === "object" && "order" in value && "payment" in value);
}

type CreateOrderResult = {
  statusCode: number;
  body: ReturnType<typeof buildCreateOrderResponse>;
};

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class OrdersService {
  async createOrder(
    input: unknown,
    cookies: Record<string, string | undefined>,
    idempotencyKeyHeader: string | string[] | undefined,
    requestInfo: RequestInfo = {},
    retryOnRace = true
  ): Promise<CreateOrderResult> {
    const parsedInput = createOrderSchema.parse(input) satisfies CreateOrderInput;
    const idempotencyKey = idempotencyKeySchema.parse(getHeaderValue(idempotencyKeyHeader));
    const user = await authService.getCurrentUser(cookies[sessionCookieName], requestInfo);
    const packageCode = getPackageCode(parsedInput);
    const storePackage = await storePackageService.findActivePackageByCode(packageCode);

    if (!storePackage) {
      await recordPaymentAudit(prisma, {
        actorType: "user",
        actorId: user.id,
        eventType: "ORDER_CREATE_FAILED",
        entityType: "order",
        userId: user.id,
        idempotencyKey,
        requestInfo,
        success: false,
        reason: "unknown_package"
      });
      throw new AppError(400, "BAD_REQUEST", "Pacote invalido.");
    }

    const requestHash = hashRequest({
      scope: orderCreateScope,
      userId: user.id,
      method: requestInfo.method ?? "POST",
      path: requestInfo.path ?? "/orders",
      body: parsedInput
    });
    const existingIdempotency = await prisma.idempotencyKey.findUnique({
      where: {
        scope_key: {
          scope: orderCreateScope,
          key: idempotencyKey
        }
      }
    });

    if (existingIdempotency) {
      if (
        existingIdempotency.userId !== user.id ||
        existingIdempotency.requestHash !== requestHash
      ) {
        await recordPaymentAudit(prisma, {
          actorType: "user",
          actorId: user.id,
          eventType: "ORDER_CREATE_IDEMPOTENCY_CONFLICT",
          entityType: "idempotency_key",
          entityId: existingIdempotency.id,
          userId: user.id,
          idempotencyKey,
          requestInfo,
          success: false,
          reason: "request_hash_mismatch"
        });
        throw new AppError(409, "CONFLICT", "Idempotency-Key reutilizada com dados diferentes.");
      }

      if (
        existingIdempotency.status === "succeeded" &&
        existingIdempotency.responseStatus &&
        isCreateOrderResponse(existingIdempotency.responseBody)
      ) {
        await recordPaymentAudit(prisma, {
          actorType: "user",
          actorId: user.id,
          eventType: "ORDER_CREATE_IDEMPOTENCY_REPLAY",
          entityType: "idempotency_key",
          entityId: existingIdempotency.id,
          userId: user.id,
          idempotencyKey,
          requestInfo,
          success: true,
          reason: "same_request_replayed"
        });

        return {
          statusCode: existingIdempotency.responseStatus,
          body: existingIdempotency.responseBody
        };
      }

      throw new AppError(409, "CONFLICT", "Pedido ainda esta em processamento.");
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const idempotency = await tx.idempotencyKey.create({
          data: {
            scope: orderCreateScope,
            key: idempotencyKey,
            userId: user.id,
            requestMethod: requestInfo.method ?? "POST",
            requestPath: requestInfo.path ?? "/orders",
            requestHash,
            status: "processing",
            lockedUntil: addMinutes(now, 5),
            expiresAt: addHours(now, 24)
          }
        });
        const order = await tx.order.create({
          data: {
            userId: user.id,
            orderNumber: buildOrderNumber(now),
            status: "pending_payment",
            packageCode: storePackage.code,
            packageName: storePackage.name,
            amountCents: storePackage.priceCents,
            currency: storePackage.currency,
            rewardType: "UP",
            rewardAmount: storePackage.upAmount,
            expiresAt: addMinutes(now, 30),
            metadata: {
              source: "frontend_order_create"
            }
          }
        });
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            userId: user.id,
            status: "pending",
            provider: futurePaymentProvider,
            amountCents: storePackage.priceCents,
            currency: storePackage.currency
          }
        });
        const orderWithPayment = await tx.order.update({
          where: {
            id: order.id
          },
          data: {
            paymentId: payment.id
          }
        });
        const responseBody = buildCreateOrderResponse(orderWithPayment, payment);

        await tx.paymentAuditLog.createMany({
          data: [
            {
              actorType: "user",
              actorId: user.id,
              eventType: "ORDER_CREATED_PENDING_PAYMENT",
              entityType: "order",
              entityId: order.id,
              userId: user.id,
              orderId: order.id,
              paymentId: payment.id,
              idempotencyKey,
              requestId: requestInfo.requestId ?? null,
              ipAddress: requestInfo.ip ?? null,
              userAgent: requestInfo.userAgent ?? null,
              success: true,
              metadata: {
                packageCode: storePackage.code,
                idempotencyId: idempotency.id
              }
            },
            {
              actorType: "system",
              eventType: "PAYMENT_CREATED_PENDING",
              entityType: "payment",
              entityId: payment.id,
              userId: user.id,
              orderId: order.id,
              paymentId: payment.id,
              idempotencyKey,
              requestId: requestInfo.requestId ?? null,
              ipAddress: requestInfo.ip ?? null,
              userAgent: requestInfo.userAgent ?? null,
              success: true,
              metadata: {
                provider: futurePaymentProvider,
                amountCents: payment.amountCents,
                currency: payment.currency
              }
            }
          ]
        });
        await tx.idempotencyKey.update({
          where: {
            id: idempotency.id
          },
          data: {
            status: "succeeded",
            responseStatus: 201,
            responseBody,
            lockedUntil: null
          }
        });

        return {
          statusCode: 201,
          body: responseBody
        };
      });
    } catch (error) {
      if (retryOnRace && isUniqueConstraintError(error)) {
        return this.createOrder(input, cookies, idempotencyKeyHeader, requestInfo, false);
      }

      throw error;
    }
  }

  async approvePaymentFromVerifiedWebhook(input: ApprovePaymentInput) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.$queryRaw`SELECT "id" FROM "payments" WHERE "id" = ${input.paymentId}::uuid FOR UPDATE`;

      const payment = await tx.payment.findUnique({
        where: {
          id: input.paymentId
        },
        include: {
          order: true
        }
      });

      if (!payment) {
        throw new AppError(404, "NOT_FOUND", "Pagamento nao encontrado.");
      }

      await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${payment.orderId}::uuid FOR UPDATE`;

      if (payment.status === "approved") {
        await recordPaymentAudit(tx, {
          actorType: "webhook",
          eventType: "PAYMENT_APPROVE_REPLAY_IGNORED",
          entityType: "payment",
          entityId: payment.id,
          userId: payment.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          requestInfo: {
            requestId: input.requestId ?? undefined
          },
          success: true,
          reason: "already_approved",
          metadata: input.metadata
        });

        return {
          alreadyApproved: true,
          paymentId: payment.id,
          orderId: payment.orderId
        };
      }

      if (!approvablePaymentStatuses.has(payment.status)) {
        await recordPaymentAudit(tx, {
          actorType: "webhook",
          eventType: "PAYMENT_APPROVE_REJECTED_BY_STATUS",
          entityType: "payment",
          entityId: payment.id,
          userId: payment.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          requestInfo: {
            requestId: input.requestId ?? undefined
          },
          success: false,
          reason: payment.status,
          metadata: input.metadata
        });
        throw new AppError(409, "CONFLICT", "Pagamento nao pode ser aprovado nesse status.");
      }

      if (
        payment.order.status !== "pending_payment" ||
        payment.amountCents !== payment.order.amountCents ||
        payment.currency !== payment.order.currency ||
        payment.order.rewardAmount <= 0
      ) {
        await recordPaymentAudit(tx, {
          actorType: "webhook",
          eventType: "PAYMENT_APPROVE_REJECTED_BY_INCONSISTENCY",
          entityType: "payment",
          entityId: payment.id,
          userId: payment.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          requestInfo: {
            requestId: input.requestId ?? undefined
          },
          success: false,
          reason: "payment_order_mismatch",
          metadata: input.metadata
        });
        throw new AppError(409, "CONFLICT", "Pagamento inconsistente com o pedido.");
      }

      const updatedPayment = await tx.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: "approved",
          providerPaymentId: input.providerPaymentId ?? payment.providerPaymentId,
          providerEventId: input.providerEventId ?? payment.providerEventId,
          approvedAt: now,
          rawProviderStatus: input.rawProviderStatus ?? payment.rawProviderStatus,
          providerPayloadHash: input.providerPayloadHash ?? payment.providerPayloadHash
        }
      });
      const updatedOrder = await tx.order.update({
        where: {
          id: payment.orderId
        },
        data: {
          status: "paid",
          paidAt: now,
          paymentId: payment.id
        }
      });
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          type: "credit_purchase",
          status: "posted",
          amount: payment.order.rewardAmount,
          currencyType: payment.order.rewardType,
          orderId: payment.orderId,
          paymentId: payment.id,
          sourceType: "payment",
          sourceId: payment.id,
          idempotencyKey: `wallet_credit:${payment.id}`,
          description: "Crédito criado por pagamento aprovado validado por webhook.",
          postedAt: now
        }
      });
      const rewardDelivery = await tx.rewardDelivery.create({
        data: {
          userId: payment.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          walletTransactionId: walletTransaction.id,
          status: "pending",
          rewardType: payment.order.rewardType,
          rewardAmount: payment.order.rewardAmount,
          idempotencyKey: `reward_delivery:${payment.id}`
        }
      });
      await tx.walletTransaction.update({
        where: {
          id: walletTransaction.id
        },
        data: {
          rewardDeliveryId: rewardDelivery.id
        }
      });
      const progressResult = await userRewardCycleService.addProgressFromPaymentTx(tx, {
        userId: payment.userId,
        walletTransactionId: walletTransaction.id,
        paymentId: payment.id,
        orderId: payment.orderId,
        amountUp: payment.order.rewardAmount,
        requestInfo: {
          requestId: input.requestId ?? undefined
        }
      });

      await tx.paymentAuditLog.createMany({
        data: [
          {
            actorType: "webhook",
            eventType: "PAYMENT_APPROVED",
            entityType: "payment",
            entityId: payment.id,
            userId: payment.userId,
            orderId: payment.orderId,
            paymentId: payment.id,
            requestId: input.requestId ?? null,
            success: true,
            metadata: input.metadata
          },
          {
            actorType: "system",
            eventType: "WALLET_CREDIT_POSTED",
            entityType: "wallet_transaction",
            entityId: walletTransaction.id,
            userId: payment.userId,
            orderId: payment.orderId,
            paymentId: payment.id,
            walletTransactionId: walletTransaction.id,
            requestId: input.requestId ?? null,
            success: true,
            metadata: {
              amount: walletTransaction.amount,
              currencyType: walletTransaction.currencyType
            }
          },
          {
            actorType: "system",
            eventType: "REWARD_DELIVERY_PENDING",
            entityType: "reward_delivery",
            entityId: rewardDelivery.id,
            userId: payment.userId,
            orderId: payment.orderId,
            paymentId: payment.id,
            rewardDeliveryId: rewardDelivery.id,
            walletTransactionId: walletTransaction.id,
            requestId: input.requestId ?? null,
            success: true,
            metadata: {
              rewardType: rewardDelivery.rewardType,
              rewardAmount: rewardDelivery.rewardAmount
            }
          }
        ]
      });

      return {
        alreadyApproved: false,
        order: updatedOrder,
        payment: updatedPayment,
        walletTransaction,
        rewardDelivery,
        progressAdded: progressResult.created
      };
    });
  }
}

export const ordersService = new OrdersService();
