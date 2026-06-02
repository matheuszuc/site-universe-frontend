import { prisma } from "../../database/prisma.js";

type CreateSessionInput = {
  userId: string;
  sessionTokenHash: string;
  csrfTokenHash?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  expiresAt: Date;
};

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

  create(input: CreateSessionInput) {
    return prisma.session.create({
      data: {
        userId: input.userId,
        sessionTokenHash: input.sessionTokenHash,
        csrfTokenHash: input.csrfTokenHash ?? null,
        ipHash: input.ipHash ?? null,
        userAgentHash: input.userAgentHash ?? null,
        expiresAt: input.expiresAt
      }
    });
  }

  revoke(sessionId: string, reason: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  setCsrfTokenHash(sessionId: string, csrfTokenHash: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        csrfTokenHash
      }
    });
  }

  revokeActiveByUserId(userId: string, reason: string) {
    return prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }
}

export const sessionsRepository = new SessionsRepository();
