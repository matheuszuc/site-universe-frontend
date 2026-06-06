import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../../utils/safe-error.js";
import { getHeaderValue } from "../idempotency/idempotency.utils.js";
import { mercadoPagoWebhookService } from "./mercado-pago-webhook.service.js";

type MercadoPagoWebhookQuery = {
  "data.id"?: string;
};

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    requestId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url
  };
}

function getWebhookBodyId(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.id === "string" || typeof record.id === "number") {
    return String(record.id);
  }

  return null;
}

export async function mercadoPagoWebhookController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const query = request.query as MercadoPagoWebhookQuery;
  const dataId = query["data.id"];

  if (!dataId) {
    throw new AppError(400, "BAD_REQUEST", "Webhook inválido.");
  }

  const result = await mercadoPagoWebhookService.handleWebhook({
    dataId,
    eventId: getWebhookBodyId(request.body) ?? dataId,
    xRequestId: getHeaderValue(request.headers["x-request-id"]),
    xSignature: getHeaderValue(request.headers["x-signature"]),
    requestInfo: getRequestInfo(request)
  });

  reply.send(result);
}
