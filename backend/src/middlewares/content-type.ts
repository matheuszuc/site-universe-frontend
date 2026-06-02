import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/safe-error.js";

export async function requireJsonContentType(request: FastifyRequest, _reply: FastifyReply) {
  const contentType = request.headers["content-type"];

  if (!contentType || Array.isArray(contentType)) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Tipo de conteúdo não suportado.");
  }

  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Tipo de conteúdo não suportado.");
  }
}
