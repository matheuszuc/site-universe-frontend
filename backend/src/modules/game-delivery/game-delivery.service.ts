import { Prisma, type GameDelivery } from "@prisma/client";

import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/safe-error.js";
import { recordPaymentAudit, type AuditRequestInfo } from "../payments/audit.service.js";
import { gfDatabaseService } from "./gf-database.service.js";

type DeliveryClient = Prisma.TransactionClient | typeof prisma;

type CreateCreditApDeliveryInput = {
  userId: string;
  orderId: string;
  paymentId: string;
  rewardDeliveryId: string;
  apAmount: number;
  requestInfo?: AuditRequestInfo;
};

type CreateRewardBoxDeliveryInput = {
  userId: string;
  userRewardCycleId: string;
  rewardTierClaimId: string;
  rewardTierCode: string;
  itemId: number;
  requestInfo?: AuditRequestInfo;
};

function getSafeErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }

  return "Falha ao processar entrega no jogo.";
}

function maskAccountName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.length <= 2) {
    return `${value[0] ?? "*"}*`;
  }

  return `${value.slice(0, 2)}***${value.slice(-1)}`;
}

export class GameDeliveryService {
  async createCreditApDeliveryTx(
    tx: Prisma.TransactionClient,
    input: CreateCreditApDeliveryInput
  ) {
    if (input.apAmount <= 0) {
      throw new AppError(409, "CONFLICT", "Quantidade de AP invalida para entrega.");
    }

    const idempotencyKey = `game-credit-ap:order:${input.orderId}`;
    const existing = await tx.gameDelivery.findUnique({
      where: {
        idempotencyKey
      }
    });

    if (existing) {
      return existing;
    }

    const gfAccountName = await this.findLinkedGfAccountNameTx(tx, input.userId);
    const delivery = await tx.gameDelivery.create({
      data: {
        userId: input.userId,
        type: "CREDIT_AP",
        status: gfAccountName ? "pending" : "failed",
        idempotencyKey,
        orderId: input.orderId,
        paymentId: input.paymentId,
        rewardDeliveryId: input.rewardDeliveryId,
        gfAccountName,
        apAmount: input.apAmount,
        lastError: gfAccountName ? null : "Conta GF vinculada nao encontrada."
      }
    });

    await recordPaymentAudit(tx, {
      actorType: "system",
      eventType: "GAME_DELIVERY_CREATED",
      entityType: "game_delivery",
      entityId: delivery.id,
      userId: input.userId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      rewardDeliveryId: input.rewardDeliveryId,
      idempotencyKey,
      requestInfo: input.requestInfo,
      success: Boolean(gfAccountName),
      reason: gfAccountName ? null : "missing_linked_gf_account",
      metadata: {
        type: "CREDIT_AP",
        status: delivery.status,
        apAmount: input.apAmount,
        gfAccountName: maskAccountName(gfAccountName)
      }
    });

    return delivery;
  }

  async createRewardBoxDeliveryTx(
    tx: Prisma.TransactionClient,
    input: CreateRewardBoxDeliveryInput
  ) {
    if (input.itemId <= 0) {
      throw new AppError(409, "CONFLICT", "Recompensa indisponivel no momento.");
    }

    const idempotencyKey =
      `game-reward-box:cycle:${input.userRewardCycleId}:tier:${input.rewardTierCode}:user:${input.userId}`;
    const existing = await tx.gameDelivery.findUnique({
      where: {
        idempotencyKey
      }
    });

    if (existing) {
      return existing;
    }

    const gfAccountName = await this.findLinkedGfAccountNameTx(tx, input.userId);
    const delivery = await tx.gameDelivery.create({
      data: {
        userId: input.userId,
        type: "REWARD_BOX",
        status: gfAccountName ? "pending" : "failed",
        idempotencyKey,
        rewardTierClaimId: input.rewardTierClaimId,
        rewardTierCode: input.rewardTierCode,
        gfAccountName,
        itemId: input.itemId,
        itemQuantity: 1,
        point: 0,
        lastError: gfAccountName ? null : "Conta GF vinculada nao encontrada."
      }
    });

    await recordPaymentAudit(tx, {
      actorType: "system",
      eventType: "GAME_DELIVERY_CREATED",
      entityType: "game_delivery",
      entityId: delivery.id,
      userId: input.userId,
      idempotencyKey,
      requestInfo: input.requestInfo,
      success: Boolean(gfAccountName),
      reason: gfAccountName ? null : "missing_linked_gf_account",
      metadata: {
        type: "REWARD_BOX",
        status: delivery.status,
        rewardTierCode: input.rewardTierCode,
        gfAccountName: maskAccountName(gfAccountName)
      }
    });

    return delivery;
  }

  async processDeliveryById(deliveryId: string, requestInfo?: AuditRequestInfo) {
    const delivery = await prisma.gameDelivery.findUnique({
      where: {
        id: deliveryId
      }
    });

    if (!delivery || delivery.status === "delivered") {
      return delivery;
    }

    if (!env.GAME_DELIVERY_ENABLED) {
      await prisma.gameDelivery.update({
        where: {
          id: delivery.id
        },
        data: {
          status: "pending",
          lockedAt: null,
          lastError: "GAME_DELIVERY_ENABLED=false; aguardando processamento."
        }
      });
      await this.recordDeliveryAudit(prisma, delivery, {
        eventType: "GAME_DELIVERY_SKIPPED_DISABLED",
        requestInfo,
        success: true,
        reason: "game_delivery_disabled"
      });

      return prisma.gameDelivery.findUnique({
        where: {
          id: delivery.id
        }
      });
    }

    const lockResult = await prisma.gameDelivery.updateMany({
      where: {
        id: delivery.id,
        status: {
          in: ["pending", "failed"]
        },
        attempts: {
          lt: delivery.maxAttempts
        }
      },
      data: {
        status: "processing",
        lockedAt: new Date(),
        attempts: {
          increment: 1
        }
      }
    });

    if (lockResult.count !== 1) {
      return prisma.gameDelivery.findUnique({
        where: {
          id: delivery.id
        }
      });
    }

    const lockedDelivery = await prisma.gameDelivery.findUniqueOrThrow({
      where: {
        id: delivery.id
      }
    });

    try {
      await this.processLockedDelivery(lockedDelivery);
      const delivered = await prisma.gameDelivery.update({
        where: {
          id: lockedDelivery.id
        },
        data: {
          status: "delivered",
          deliveredAt: new Date(),
          lockedAt: null,
          lastError: null
        }
      });

      if (delivered.rewardTierClaimId) {
        await prisma.userRewardTierClaim.update({
          where: {
            id: delivered.rewardTierClaimId
          },
          data: {
            status: "claimed",
            deliveryStatus: "delivered"
          }
        });
      }

      if (delivered.rewardDeliveryId) {
        await prisma.rewardDelivery.update({
          where: {
            id: delivered.rewardDeliveryId
          },
          data: {
            status: "delivered",
            deliveredAt: delivered.deliveredAt
          }
        });
      }

      await this.recordDeliveryAudit(prisma, delivered, {
        eventType: "GAME_DELIVERY_DELIVERED",
        requestInfo,
        success: true
      });

      return delivered;
    } catch (error) {
      const safeError = getSafeErrorMessage(error);
      const failed = await prisma.gameDelivery.update({
        where: {
          id: lockedDelivery.id
        },
        data: {
          status: "failed",
          lockedAt: null,
          lastError: safeError
        }
      });

      if (failed.rewardTierClaimId) {
        await prisma.userRewardTierClaim.update({
          where: {
            id: failed.rewardTierClaimId
          },
          data: {
            deliveryStatus: "failed"
          }
        });
      }

      if (failed.rewardDeliveryId) {
        await prisma.rewardDelivery.update({
          where: {
            id: failed.rewardDeliveryId
          },
          data: {
            status: "failed",
            failedAt: new Date(),
            lastError: safeError
          }
        });
      }

      await this.recordDeliveryAudit(prisma, failed, {
        eventType: "GAME_DELIVERY_FAILED",
        requestInfo,
        success: false,
        reason: safeError
      });

      return failed;
    }
  }

  async processPendingDeliveries(limit = 20) {
    const deliveries = await prisma.gameDelivery.findMany({
      where: {
        status: {
          in: ["pending", "failed"]
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: limit
    });
    const results = [];

    for (const delivery of deliveries) {
      results.push(await this.processDeliveryById(delivery.id));
    }

    return results;
  }

  private async processLockedDelivery(delivery: GameDelivery) {
    let gfAccountName = delivery.gfAccountName;

    if (!gfAccountName) {
      gfAccountName = await this.findLinkedGfAccountNameTx(prisma, delivery.userId);

      if (gfAccountName) {
        await prisma.gameDelivery.update({
          where: {
            id: delivery.id
          },
          data: {
            gfAccountName
          }
        });
      }
    }

    if (!gfAccountName) {
      throw new AppError(409, "CONFLICT", "Conta GF vinculada nao encontrada.");
    }

    if (delivery.type === "CREDIT_AP") {
      if (!delivery.apAmount || delivery.apAmount <= 0) {
        throw new AppError(409, "CONFLICT", "Quantidade de AP invalida.");
      }

      await gfDatabaseService.creditAp({
        accountName: gfAccountName,
        apAmount: delivery.apAmount
      });
      return;
    }

    if (delivery.type === "REWARD_BOX") {
      if (!delivery.itemId || !delivery.itemQuantity) {
        throw new AppError(409, "CONFLICT", "Recompensa indisponivel no momento.");
      }

      await gfDatabaseService.insertRewardBox({
        accountName: gfAccountName,
        itemId: delivery.itemId,
        itemQuantity: delivery.itemQuantity,
        point: delivery.point ?? 0
      });
      return;
    }

    throw new AppError(409, "CONFLICT", "Tipo de entrega invalido.");
  }

  private findLinkedGfAccountNameTx(client: DeliveryClient, userId: string) {
    return client.gameAccount
      .findFirst({
        where: {
          userId,
          status: {
            in: ["linked", "migrated"]
          }
        },
        orderBy: {
          createdAt: "asc"
        },
        select: {
          gameLogin: true
        }
      })
      .then((account) => account?.gameLogin ?? null);
  }

  private recordDeliveryAudit(
    client: DeliveryClient,
    delivery: GameDelivery,
    input: {
      eventType: string;
      requestInfo?: AuditRequestInfo;
      success: boolean;
      reason?: string | null;
    }
  ) {
    return recordPaymentAudit(client, {
      actorType: "system",
      eventType: input.eventType,
      entityType: "game_delivery",
      entityId: delivery.id,
      userId: delivery.userId,
      orderId: delivery.orderId,
      paymentId: delivery.paymentId,
      rewardDeliveryId: delivery.rewardDeliveryId,
      idempotencyKey: delivery.idempotencyKey,
      requestInfo: input.requestInfo,
      success: input.success,
      reason: input.reason,
      metadata: {
        type: delivery.type,
        status: delivery.status,
        attempts: delivery.attempts,
        gfAccountName: maskAccountName(delivery.gfAccountName),
        rewardTierCode: delivery.rewardTierCode
      }
    });
  }
}

export const gameDeliveryService = new GameDeliveryService();
