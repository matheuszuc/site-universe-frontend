import { prisma } from "../../database/prisma.js";

export class SessionsRepository {
  findActiveByTokenHash(sessionTokenHash: string, now = new Date()) {
    return prisma.session.findFirst({
      where: {
        sessionTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now
        }
      },
      include: {
        user: true
      }
    });
  }

  touch(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date()
      }
    });
  }
}

export const sessionsRepository = new SessionsRepository();
