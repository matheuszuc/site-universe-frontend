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
}

export const usersRepository = new UsersRepository();
