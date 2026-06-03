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
}

export const dashboardRepository = new DashboardRepository();
