import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/safe-error.js";
import { gameDeliveryService } from "../game-delivery/game-delivery.service.js";
import { addHours, addMinutes, hashRequest } from "../idempotency/idempotency.utils.js";
import { recordPaymentAudit, type AuditRequestInfo } from "../payments/audit.service.js";

type RewardTx = Prisma.TransactionClient;

type AddProgressInput = {
  userId: string;
  walletTransactionId: string;
  paymentId?: string | null;
  orderId?: string | null;
  amountUp: number;
  requestInfo?: AuditRequestInfo;
};

type ClaimInput = {
  userId: string;
  tierCode: string;
  body: unknown;
  idempotencyKey: string;
  requestInfo: AuditRequestInfo & {
    method?: string;
    path?: string;
  };
};

const rewardTierClaimScope = "reward_tier_claim";

export function calculateRewardCycleCarryOver(accumulatedUp: number, finalThreshold: number) {
  return Math.max(accumulatedUp - finalThreshold, 0);
}

function toPublicTier(tier: {
  code: string;
  name: string;
  requiredUpTotal: number;
  displayOrder: number;
  items: Array<{
    itemName: string;
    itemDescription: string | null;
    quantity: number;
  }>;
}) {
  return {
    code: tier.code,
    name: tier.name,
    requiredUpTotal: tier.requiredUpTotal,
    displayOrder: tier.displayOrder,
    items: tier.items.map((item) => ({
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      quantity: item.quantity
    }))
  };
}

function isClaimResponse(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && "claim" in value);
}

export class UserRewardCycleService {
  async getOrCreateActiveCycle(userId: string) {
    return prisma.$transaction((tx) => this.getOrCreateActiveCycleTx(tx, userId));
  }

  async getCurrentScaleProgress(userId: string) {
    return prisma.$transaction(async (tx) => {
      const cycle = await this.getOrCreateActiveCycleTx(tx, userId);
      const [tiers, claims] = await Promise.all([
        tx.rewardTier.findMany({
          where: {
            isActive: true
          },
          include: {
            items: {
              orderBy: {
                displayOrder: "asc"
              },
              select: {
                itemName: true,
                itemDescription: true,
                quantity: true
              }
            }
          },
          orderBy: {
            displayOrder: "asc"
          }
        }),
        tx.userRewardTierClaim.findMany({
          where: {
            userRewardCycleId: cycle.id
          },
          include: {
            rewardTier: true
          }
        })
      ]);
      const claimsByTierId = new Map(claims.map((claim) => [claim.rewardTierId, claim]));
      const nextTier =
        tiers.find((tier) => tier.requiredUpTotal > cycle.accumulatedUp) ??
        tiers[tiers.length - 1] ??
        null;

      return {
        currentCycle: {
          cycleNumber: cycle.cycleNumber,
          accumulatedUp: cycle.accumulatedUp,
          status: cycle.status
        },
        nextTier: nextTier
          ? {
              code: nextTier.code,
              name: nextTier.name,
              requiredUpTotal: nextTier.requiredUpTotal,
              missingUp: Math.max(0, nextTier.requiredUpTotal - cycle.accumulatedUp)
            }
          : null,
        tiers: tiers.map((tier) => {
          const claim = claimsByTierId.get(tier.id);
          const publicTier = toPublicTier(tier);

          return {
            ...publicTier,
            status: claim
              ? claim.deliveryStatus === "delivered"
                ? "delivered"
                : claim.status === "claimed"
                  ? "claimed"
                  : "delivery_pending"
              : cycle.accumulatedUp >= tier.requiredUpTotal
                ? "eligible"
                : "locked"
          };
        })
      };
    });
  }

  async addProgressFromPaymentTx(tx: RewardTx, input: AddProgressInput) {
    if (input.amountUp <= 0) {
      throw new AppError(409, "CONFLICT", "Quantidade de AP invalida para progresso.");
    }

    const existingEvent = await tx.userRewardCycleProgressEvent.findUnique({
      where: {
        walletTransactionId: input.walletTransactionId
      }
    });

    if (existingEvent) {
      return {
        created: false,
        event: existingEvent
      };
    }

    const cycle = await this.getOrCreateActiveCycleTx(tx, input.userId);
    const event = await tx.userRewardCycleProgressEvent.create({
      data: {
        userId: input.userId,
        userRewardCycleId: cycle.id,
        walletTransactionId: input.walletTransactionId,
        paymentId: input.paymentId ?? null,
        orderId: input.orderId ?? null,
        amountUp: input.amountUp,
        sourceType: "payment_purchase",
        sourceId: input.walletTransactionId
      }
    });
    await tx.userRewardCycle.update({
      where: {
        id: cycle.id
      },
      data: {
        accumulatedUp: {
          increment: input.amountUp
        }
      }
    });
    await recordPaymentAudit(tx, {
      actorType: "system",
      eventType: "REWARD_CYCLE_PROGRESS_ADDED",
      entityType: "user_reward_cycle",
      entityId: cycle.id,
      userId: input.userId,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      walletTransactionId: input.walletTransactionId,
      requestInfo: input.requestInfo,
      success: true,
      metadata: {
        amountUp: input.amountUp,
        progressEventId: event.id
      }
    });

    return {
      created: true,
      event
    };
  }

  async claimTier(input: ClaimInput) {
    const requestHash = hashRequest({
      scope: rewardTierClaimScope,
      userId: input.userId,
      method: input.requestInfo.method ?? "POST",
      path: input.requestInfo.path ?? `/api/rewards/tiers/${input.tierCode}/claim`,
      body: input.body,
      tierCode: input.tierCode
    });
    const existingIdempotency = await prisma.idempotencyKey.findUnique({
      where: {
        scope_key: {
          scope: rewardTierClaimScope,
          key: input.idempotencyKey
        }
      }
    });

    if (existingIdempotency) {
      if (
        existingIdempotency.userId !== input.userId ||
        existingIdempotency.requestHash !== requestHash
      ) {
        await recordPaymentAudit(prisma, {
          actorType: "user",
          actorId: input.userId,
          eventType: "REWARD_TIER_CLAIM_IDEMPOTENCY_CONFLICT",
          entityType: "idempotency_key",
          entityId: existingIdempotency.id,
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          requestInfo: input.requestInfo,
          success: false,
          reason: "request_hash_mismatch"
        });
        throw new AppError(409, "CONFLICT", "Idempotency-Key reutilizada com dados diferentes.");
      }

      if (
        existingIdempotency.status === "succeeded" &&
        existingIdempotency.responseStatus &&
        isClaimResponse(existingIdempotency.responseBody)
      ) {
        await recordPaymentAudit(prisma, {
          actorType: "user",
          actorId: input.userId,
          eventType: "REWARD_TIER_CLAIM_REPLAY_IGNORED",
          entityType: "idempotency_key",
          entityId: existingIdempotency.id,
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          requestInfo: input.requestInfo,
          success: true,
          reason: "same_request_replayed"
        });

        return {
          statusCode: existingIdempotency.responseStatus,
          body: existingIdempotency.responseBody
        };
      }

      throw new AppError(409, "CONFLICT", "Resgate ainda esta em processamento.");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const now = new Date();
        const idempotency = await tx.idempotencyKey.create({
          data: {
            scope: rewardTierClaimScope,
            key: input.idempotencyKey,
            userId: input.userId,
            requestMethod: input.requestInfo.method ?? "POST",
            requestPath:
              input.requestInfo.path ?? `/api/rewards/tiers/${input.tierCode}/claim`,
            requestHash,
            status: "processing",
            lockedUntil: addMinutes(now, 5),
            expiresAt: addHours(now, 24)
          }
        });
        let cycle = await this.getOrCreateActiveCycleTx(tx, input.userId);

        // Serialize all claims for this user's cycle: locking the cycle row makes
        // the eligibility read and the cycle-completion counting consistent against
        // concurrent claims and concurrent payment progress increments.
        await tx.$queryRaw`SELECT "id" FROM "user_reward_cycles" WHERE "id" = ${cycle.id}::uuid FOR UPDATE`;
        cycle = await tx.userRewardCycle.findUniqueOrThrow({ where: { id: cycle.id } });

        // Defense in depth: the controller already blocks blocked/unverified users,
        // but re-check inside the atomic claim so a box can never be granted to a
        // blocked or unverified account.
        const claimingUser = await tx.user.findUnique({
          where: { id: input.userId },
          select: { status: true, emailVerifiedAt: true }
        });

        if (!claimingUser || claimingUser.status === "suspended" || claimingUser.status === "deleted") {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_USER_STATUS",
            entityType: "user",
            entityId: input.userId,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "user_blocked_or_deleted"
          });
          throw new AppError(403, "FORBIDDEN", "Conta indisponivel para resgate.");
        }

        if (env.EMAIL_REQUIRE_VERIFIED && !claimingUser.emailVerifiedAt) {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_EMAIL_NOT_VERIFIED",
            entityType: "user",
            entityId: input.userId,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "email_not_verified"
          });
          throw new AppError(403, "EMAIL_NOT_VERIFIED", "Confirme seu e-mail antes de resgatar.");
        }

        const tier = await tx.rewardTier.findFirst({
          where: {
            code: input.tierCode,
            isActive: true
          },
          include: {
            items: {
              orderBy: {
                displayOrder: "asc"
              },
              select: {
                itemName: true,
                itemDescription: true,
                quantity: true
              }
            }
          }
        });

        if (!tier) {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_NOT_FOUND",
            entityType: "reward_tier",
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "tier_not_found"
          });
          throw new AppError(404, "NOT_FOUND", "Rank nao encontrado.");
        }

        if (cycle.accumulatedUp < tier.requiredUpTotal) {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_NOT_ELIGIBLE",
            entityType: "reward_tier",
            entityId: tier.id,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "insufficient_accumulated_up",
            metadata: {
              accumulatedUp: cycle.accumulatedUp,
              requiredUpTotal: tier.requiredUpTotal
            }
          });
          throw new AppError(409, "CONFLICT", "Progresso insuficiente para este rank.");
        }

        if (!tier.boxGameItemId) {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_MISSING_BOX_ITEM_ID",
            entityType: "reward_tier",
            entityId: tier.id,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "missing_box_game_item_id",
            metadata: {
              tierCode: tier.code
            }
          });
          throw new AppError(409, "CONFLICT", "Recompensa indisponivel no momento.");
        }

        const existingClaim = await tx.userRewardTierClaim.findUnique({
          where: {
            userRewardCycleId_rewardTierId: {
              userRewardCycleId: cycle.id,
              rewardTierId: tier.id
            }
          }
        });

        if (existingClaim) {
          await recordPaymentAudit(tx, {
            actorType: "user",
            actorId: input.userId,
            eventType: "REWARD_TIER_CLAIM_REJECTED_ALREADY_CLAIMED",
            entityType: "reward_tier",
            entityId: tier.id,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            requestInfo: input.requestInfo,
            success: false,
            reason: "already_claimed"
          });
          throw new AppError(409, "CONFLICT", "Rank ja resgatado neste ciclo.");
        }

        const claim = await tx.userRewardTierClaim.create({
          data: {
            userId: input.userId,
            userRewardCycleId: cycle.id,
            rewardTierId: tier.id,
            status: "delivery_pending",
            claimedAt: now,
            deliveryStatus: "pending_game_integration",
            idempotencyKey: input.idempotencyKey
          }
        });
        const rewardDelivery = await tx.rewardDelivery.create({
          data: {
            userId: input.userId,
            status: "pending",
            rewardType: "REWARD_BOX",
            rewardAmount: 1,
            idempotencyKey: `reward_box_delivery:${claim.id}`
          }
        });
        let claimWithDelivery = await tx.userRewardTierClaim.update({
          where: {
            id: claim.id
          },
          data: {
            rewardDeliveryId: rewardDelivery.id
          }
        });
        const gameDelivery = await gameDeliveryService.createRewardBoxDeliveryTx(tx, {
          userId: input.userId,
          userRewardCycleId: cycle.id,
          rewardDeliveryId: rewardDelivery.id,
          rewardTierClaimId: claim.id,
          rewardTierCode: tier.code,
          itemId: tier.boxGameItemId,
          requestInfo: input.requestInfo
        });

        if (gameDelivery.status === "failed") {
          claimWithDelivery = await tx.userRewardTierClaim.update({
            where: {
              id: claim.id
            },
            data: {
              deliveryStatus: "failed"
            }
          });
          await tx.rewardDelivery.update({
            where: {
              id: rewardDelivery.id
            },
            data: {
              status: "failed",
              failedAt: now,
              lastError: gameDelivery.lastError
            }
          });
        }

        const lastTier = await tx.rewardTier.findFirst({
          where: {
            isActive: true
          },
          orderBy: {
            displayOrder: "desc"
          }
        });
        const activeTierCount = await tx.rewardTier.count({
          where: {
            isActive: true
          }
        });
        const claimedTierCount = await tx.userRewardTierClaim.count({
          where: {
            userRewardCycleId: cycle.id
          }
        });
        const shouldCompleteCycle = Boolean(
          lastTier && activeTierCount > 0 && claimedTierCount === activeTierCount
        );
        let nextCycle: { cycleNumber: number; accumulatedUp: number; status: string } | null = null;

        if (shouldCompleteCycle && lastTier) {
          const carryOverUp = calculateRewardCycleCarryOver(
            cycle.accumulatedUp,
            lastTier.requiredUpTotal
          );

          await tx.userRewardCycle.update({
            where: {
              id: cycle.id
            },
            data: {
              status: "completed",
              completedAt: now,
              resetAt: now
            }
          });
          const createdNextCycle = await tx.userRewardCycle.create({
            data: {
              userId: input.userId,
              cycleNumber: cycle.cycleNumber + 1,
              status: "active",
              accumulatedUp: carryOverUp,
              startedAt: now
            }
          });
          nextCycle = {
            cycleNumber: createdNextCycle.cycleNumber,
            accumulatedUp: createdNextCycle.accumulatedUp,
            status: createdNextCycle.status
          };

          await recordPaymentAudit(tx, {
            actorType: "system",
            eventType: "REWARD_CYCLE_COMPLETED",
            entityType: "user_reward_cycle",
            entityId: cycle.id,
            userId: input.userId,
            requestInfo: input.requestInfo,
            success: true,
            metadata: {
              completedByTier: tier.code,
              claimedTierCount,
              activeTierCount,
              accumulatedUp: cycle.accumulatedUp,
              finalThreshold: lastTier.requiredUpTotal,
              carryOverUp
            }
          });
          await recordPaymentAudit(tx, {
            actorType: "system",
            eventType: "REWARD_CYCLE_ROLLOVER_CARRY_OVER",
            entityType: "user_reward_cycle",
            entityId: createdNextCycle.id,
            userId: input.userId,
            requestInfo: input.requestInfo,
            success: true,
            metadata: {
              previousCycleId: cycle.id,
              sourceCycleId: cycle.id,
              accumulatedUp: cycle.accumulatedUp,
              finalThreshold: lastTier.requiredUpTotal,
              carryOverUp,
              reason: "cycle_rollover_carry_over"
            }
          });
        }

        const responseBody = {
          claim: {
            id: claim.id,
            status: claimWithDelivery.status,
            deliveryStatus: claimWithDelivery.deliveryStatus,
            claimedAt: claimWithDelivery.claimedAt?.toISOString() ?? null
          },
          tier: toPublicTier(tier),
          cycle: {
            cycleNumber: cycle.cycleNumber,
            accumulatedUp: cycle.accumulatedUp,
            status: shouldCompleteCycle ? "completed" : cycle.status
          },
          gameDelivery: {
            id: gameDelivery.id,
            type: gameDelivery.type,
            status: gameDelivery.status,
            rewardDeliveryId: gameDelivery.rewardDeliveryId
          },
          nextCycle
        };

        await recordPaymentAudit(tx, {
          actorType: "user",
          actorId: input.userId,
          eventType: "REWARD_TIER_CLAIM_CREATED",
          entityType: "reward_tier",
          entityId: tier.id,
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          requestInfo: input.requestInfo,
          success: true,
          metadata: {
            claimId: claim.id,
            cycleId: cycle.id,
            gameDeliveryId: gameDelivery.id,
            rewardDeliveryId: rewardDelivery.id
          }
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
          body: responseBody,
          gameDelivery
        };
      });

      if (result.gameDelivery.status === "pending") {
        await gameDeliveryService.processDeliveryById(result.gameDelivery.id, input.requestInfo);
      }

      return {
        statusCode: result.statusCode,
        body: result.body
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(409, "CONFLICT", "Conflito ao registrar resgate.");
      }

      throw error;
    }
  }

  private async getOrCreateActiveCycleTx(tx: RewardTx, userId: string) {
    const activeCycle = await tx.userRewardCycle.findFirst({
      where: {
        userId,
        status: "active"
      }
    });

    if (activeCycle) {
      return activeCycle;
    }

    const lastCycle = await tx.userRewardCycle.findFirst({
      where: {
        userId
      },
      orderBy: {
        cycleNumber: "desc"
      }
    });
    const cycle = await tx.userRewardCycle.create({
      data: {
        userId,
        cycleNumber: (lastCycle?.cycleNumber ?? 0) + 1,
        status: "active",
        accumulatedUp: 0,
        startedAt: new Date()
      }
    });

    await recordPaymentAudit(tx, {
      actorType: "system",
      eventType: "REWARD_CYCLE_CREATED",
      entityType: "user_reward_cycle",
      entityId: cycle.id,
      userId,
      success: true,
      metadata: {
        cycleNumber: cycle.cycleNumber
      }
    });

    return cycle;
  }
}

export const userRewardCycleService = new UserRewardCycleService();
