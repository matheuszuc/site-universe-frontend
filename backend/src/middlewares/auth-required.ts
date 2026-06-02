import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../config/cookies.js";
import { AppError } from "../utils/safe-error.js";

export async function authRequired(request: FastifyRequest, _reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];

  if (!sessionToken) {
    throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
  }
}
