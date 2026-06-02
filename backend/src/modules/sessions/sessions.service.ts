import { sessionsRepository } from "./sessions.repository.js";
import { tokenService } from "../security/token.service.js";

export class SessionsService {
  async findValidSession(sessionToken: string) {
    const sessionTokenHash = tokenService.hashToken(sessionToken);
    return sessionsRepository.findActiveByTokenHash(sessionTokenHash);
  }

  touch(sessionId: string) {
    return sessionsRepository.touch(sessionId);
  }
}

export const sessionsService = new SessionsService();
