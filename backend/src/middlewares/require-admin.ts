import type { FastifyRequest } from "fastify";

import { sessionCookieName } from "../config/cookies.js";
import { authService } from "../modules/auth/auth.service.js";
import { AppError } from "../utils/safe-error.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"]
  };
}

export async function requireAdmin(request: FastifyRequest) {
  const user = await authService.getCurrentUser(
    request.cookies[sessionCookieName],
    getRequestInfo(request)
  );

  if (user.role !== "ADMIN") {
    throw new AppError(403, "FORBIDDEN", "Acesso negado.");
  }
}
