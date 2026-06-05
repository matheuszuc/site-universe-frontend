import { prisma } from "../../database/prisma.js";

const safeActivityTypes = [
  "REGISTER_CREATED",
  "ACCOUNT_CREATED",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_SUCCESS"
] as const;

export type SafeActivityType = (typeof safeActivityTypes)[number];

export class DashboardRepository {
  findSafeUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
  }

  findSafeActivityByUserId(userId: string) {
    return prisma.securityEvent.findMany({
      where: {
        userId,
        eventType: {
          in: [...safeActivityTypes]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20,
      select: {
        eventType: true,
        createdAt: true
      }
    });
  }

  getUserApSummary(userId: string) {
    return prisma.$transaction(async (tx) => {
      const [walletBalance, activeCycle, paidOrders] = await Promise.all([
        tx.walletTransaction.aggregate({
          where: {
            userId,
            currencyType: "AP",
            status: "posted"
          },
          _sum: {
            amount: true
          }
        }),
        tx.userRewardCycle.findFirst({
          where: {
            userId,
            status: "active"
          },
          orderBy: {
            cycleNumber: "desc"
          },
          select: {
            accumulatedUp: true,
            cycleNumber: true
          }
        }),
        tx.order.aggregate({
          where: {
            userId,
            status: {
              in: ["paid", "fulfilled"]
            }
          },
          _count: {
            _all: true
          }
        })
      ]);

      return {
        availableAp: walletBalance._sum.amount ?? 0,
        cycleAccumulatedAp: activeCycle?.accumulatedUp ?? 0,
        currentCycleNumber: activeCycle?.cycleNumber ?? null,
        paidOrdersCount: paidOrders._count._all
      };
    });
  }
}

export const dashboardRepository = new DashboardRepository();
