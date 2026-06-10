import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../config/cookies.js";
import { sessionsService } from "../modules/sessions/sessions.service.js";
import { AppError } from "../utils/safe-error.js";

export async function authRequired(request: FastifyRequest, _reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];

  if (!sessionToken) {
    throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
  }

  const session = await sessionsService.findValidSession(sessionToken);

  if (!session) {
    throw new AppError(401, "UNAUTHORIZED", "Sessão inválida ou expirada.");
  }
}
