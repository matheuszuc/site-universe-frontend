import type { FastifyReply, FastifyRequest } from "fastify";

import { env, isProduction } from "../config/env.js";
import { securityEventsService } from "../modules/security/security-events.service.js";
import { AppError } from "../utils/safe-error.js";

function isAllowedUrl(value: string) {
  try {
    const receivedUrl = new URL(value);
    const allowedUrl = new URL(env.FRONTEND_URL);

    return receivedUrl.origin === allowedUrl.origin;
  } catch {
    return false;
  }
}

export async function requireAllowedOrigin(request: FastifyRequest, _reply: FastifyReply) {
  if (!isProduction) {
    return;
  }

  const origin = request.headers.origin;
  const referer = request.headers.referer;
  const originAllowed = typeof origin === "string" && isAllowedUrl(origin);
  const refererAllowed = typeof referer === "string" && isAllowedUrl(referer);

  if (originAllowed || refererAllowed) {
    return;
  }

  await securityEventsService.record({
    eventType: "FORBIDDEN_ORIGIN",
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    metadata: {
      origin: typeof origin === "string" ? origin : null,
      referer: typeof referer === "string" ? referer : null
    }
  });

  throw new AppError(403, "FORBIDDEN_ORIGIN", "Origem não permitida.");
}
