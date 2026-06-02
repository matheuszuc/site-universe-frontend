import { sessionsRepository } from "./sessions.repository.js";
import { tokenService } from "../security/token.service.js";
import { env } from "../../config/env.js";

type RequestInfo = {
  ip?: string;
  userAgent?: string;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export class SessionsService {
  async findValidSession(sessionToken: string) {
    const sessionTokenHash = tokenService.hashToken(sessionToken);
    return sessionsRepository.findActiveByTokenHash(sessionTokenHash);
  }

  touch(sessionId: string) {
    return sessionsRepository.touch(sessionId);
  }

  async createSession(userId: string, requestInfo: RequestInfo) {
    const sessionToken = tokenService.generateOpaqueToken();
    const sessionTokenHash = tokenService.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * millisecondsPerDay);

    await sessionsRepository.create({
      userId,
      sessionTokenHash,
      ipHash: tokenService.hashOptionalValue(requestInfo.ip),
      userAgentHash: tokenService.hashOptionalValue(requestInfo.userAgent),
      expiresAt
    });

    return {
      sessionToken,
      expiresAt
    };
  }

  async revokeSession(sessionToken: string, reason = "logout") {
    const session = await this.findValidSession(sessionToken);

    if (!session) {
      return null;
    }

    await sessionsRepository.revoke(session.id, reason);
    return session;
  }
}

export const sessionsService = new SessionsService();
