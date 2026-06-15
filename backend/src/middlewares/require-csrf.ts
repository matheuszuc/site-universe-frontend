import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../config/cookies.js";
import { csrfService } from "../modules/security/csrf.service.js";
import { sessionsService } from "../modules/sessions/sessions.service.js";
import { AppError } from "../utils/safe-error.js";

function getSingleHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Protege mutações autenticadas baseadas em cookie de sessão contra CSRF.
// Mesmo padrão já usado no logout: o cliente obtém o token em GET /auth/csrf e
// o reenvia no header X-CSRF-Token. Webhooks externos NÃO usam este middleware.
export async function requireCsrf(request: FastifyRequest, _reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];

  if (!sessionToken) {
    throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
  }

  const session = await sessionsService.findValidSession(sessionToken);

  if (!session) {
    throw new AppError(401, "UNAUTHORIZED", "Sessão inválida ou expirada.");
  }

  const csrfToken = getSingleHeaderValue(request.headers["x-csrf-token"]);

  if (!csrfService.verifyToken(csrfToken, session.csrfTokenHash)) {
    throw new AppError(403, "CSRF_FAILED", "Falha na verificação de segurança da requisição.");
  }
}
