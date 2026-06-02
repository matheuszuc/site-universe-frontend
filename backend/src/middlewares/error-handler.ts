import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError, safeError, type SafeErrorCode } from "../utils/safe-error.js";

type FastifyErrorLike = Error & {
  code?: string;
  statusCode?: number;
};

const fastifySafeErrorByStatus: Record<number, { code: SafeErrorCode; message: string }> = {
  400: { code: "BAD_REQUEST", message: "Requisição inválida." },
  401: { code: "UNAUTHORIZED", message: "Não autorizado." },
  403: { code: "FORBIDDEN", message: "Acesso negado." },
  404: { code: "NOT_FOUND", message: "Recurso não encontrado." },
  409: { code: "CONFLICT", message: "Conflito ao processar requisição." },
  415: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Tipo de conteúdo não suportado." }
};

function getFastifySafeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const fastifyError = error as FastifyErrorLike;

  if (!fastifyError.statusCode) {
    return null;
  }

  if (fastifyError.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
    return {
      statusCode: 415,
      code: "UNSUPPORTED_MEDIA_TYPE" as const,
      message: "Tipo de conteúdo não suportado."
    };
  }

  const safeErrorByStatus = fastifySafeErrorByStatus[fastifyError.statusCode] ?? {
    code: "INTERNAL_SERVER_ERROR" as const,
    message: "Erro interno."
  };

  return {
    statusCode: fastifyError.statusCode,
    ...safeErrorByStatus
  };
}

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

    const fastifySafeError = getFastifySafeError(error);

    if (fastifySafeError) {
      request.log.warn({ err: error, requestId: request.id }, "Fastify request error");
      reply
        .status(fastifySafeError.statusCode)
        .send(safeError(fastifySafeError.code, fastifySafeError.message));
      return;
    }

    request.log.error({ err: error, requestId: request.id }, "Unhandled error");
    reply.status(500).send(safeError("INTERNAL_SERVER_ERROR", "Erro interno."));
  });
}
