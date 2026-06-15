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

  // Bloqueia sessões de contas suspensas/excluídas mesmo que o token ainda não
  // tenha expirado/sido revogado — garante efeito imediato do bloqueio de conta
  // em todas as rotas protegidas por authRequired.
  if (session.user.status === "suspended" || session.user.status === "deleted") {
    throw new AppError(403, "FORBIDDEN", "Conta indisponível.");
  }
}
