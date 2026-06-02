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
        lastLoginAt: new Date()
      }
    });
  }

  incrementFailedLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: {
          increment: 1
        }
      }
    });
  }
}

export const usersRepository = new UsersRepository();
