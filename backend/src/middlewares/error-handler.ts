import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError, safeError } from "../utils/safe-error.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error, requestId: request.id }, "Handled application error");
      reply.status(error.statusCode).send(safeError(error.code, error.message));
      return;
    }

    if (error instanceof ZodError) {
      request.log.warn({ err: error, requestId: request.id }, "Validation error");
      reply.status(400).send(safeError("BAD_REQUEST", "Dados inválidos."));
      return;
    }

    request.log.error({ err: error, requestId: request.id }, "Unhandled error");
    reply.status(500).send(safeError("INTERNAL_SERVER_ERROR", "Erro interno."));
  });
}
