import { Prisma } from "@prisma/client";

import { prisma } from "../../database/prisma.js";
import { tokenService } from "./token.service.js";

type RecordSecurityEventInput = {
  userId?: string | null;
  eventType: string;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

export class SecurityEventsService {
  async record(input: RecordSecurityEventInput) {
    await prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        eventType: input.eventType,
        ipHash: tokenService.hashOptionalValue(input.ip),
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined
      }
    });
  }
}

export const securityEventsService = new SecurityEventsService();
