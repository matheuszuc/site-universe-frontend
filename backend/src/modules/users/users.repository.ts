import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";

export class UsersRepository {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  findByNormalizedEmail(emailNormalized: string) {
    return prisma.user.findUnique({
      where: { emailNormalized }
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  updateLoginSuccess(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });
  }

  recordLoginFailure(id: string, failedLoginCount: number, lockedUntil: Date | null) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount,
        lockedUntil
      }
    });
  }

  markEmailVerified(id: string, verifiedAt: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: verifiedAt,
        status: "active"
      }
    });
  }

  updatePasswordAfterReset(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null
      }
    });
  }
}

export const usersRepository = new UsersRepository();
