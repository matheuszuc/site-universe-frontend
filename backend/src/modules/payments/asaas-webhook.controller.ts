import type { FastifyReply, FastifyRequest } from "fastify";

import { getHeaderValue } from "../idempotency/idempotency.utils.js";
import { asaasWebhookService } from "./asaas-webhook.service.js";

type AsaasWebhookBody = {
  id?: unknown;
  event?: unknown;
  payment?: {
    id?: unknown;
    externalReference?: unknown;
  };
};

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    requestId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url
  };
}

export async function asaasWebhookController(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as AsaasWebhookBody;
  const payment = body.payment ?? {};
  const event = asString(body.event);
  const paymentId = asString(payment.id);
  const externalReference = asString(payment.externalReference);
  // Asaas sends a unique delivery id; fall back to event+paymentId so retries of the
  // same notification collapse to one approval.
  const eventId = asString(body.id) ?? `${event ?? "event"}:${paymentId ?? "na"}`;

  const result = await asaasWebhookService.handleWebhook({
    event,
    externalReference,
    paymentId,
    eventId,
    webhookToken: getHeaderValue(request.headers["asaas-access-token"]),
    requestInfo: getRequestInfo(request)
  });

  reply.send(result);
}
