import type { FastifyReply, FastifyRequest } from "fastify";

import { getHeaderValue } from "../idempotency/idempotency.utils.js";
import { openPixWebhookService } from "./openpix-webhook.service.js";

type OpenPixWebhookBody = {
  event?: unknown;
  charge?: {
    correlationID?: unknown;
    identifier?: unknown;
    status?: unknown;
  };
  pix?: {
    charge?: {
      correlationID?: unknown;
      identifier?: unknown;
      status?: unknown;
    };
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

export async function openPixWebhookController(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as OpenPixWebhookBody;
  const charge = body.charge ?? body.pix?.charge ?? {};
  const event = asString(body.event);
  const correlationID = asString(charge.correlationID);
  const chargeIdentifier = asString(charge.identifier);
  const status = asString(charge.status);
  // OpenPix does not always include a stable delivery id; derive a deterministic
  // dedupe key from the meaningful fields so retries collapse to one approval.
  const eventId = `${event ?? "event"}:${correlationID ?? "na"}:${chargeIdentifier ?? "na"}:${status ?? "na"}`;
  const rawBody = typeof (request as { rawBody?: string }).rawBody === "string"
    ? (request as { rawBody?: string }).rawBody ?? ""
    : "";

  const result = await openPixWebhookService.handleWebhook({
    event,
    correlationID,
    chargeIdentifier,
    eventId,
    rawBody,
    signature: getHeaderValue(request.headers["x-openpix-signature"]),
    requestInfo: getRequestInfo(request)
  });

  reply.send(result);
}
