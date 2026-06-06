import type { FastifyReply, FastifyRequest } from "fastify";

import { isDevelopment } from "../../config/env.js";
import { ordersService } from "../orders/orders.service.js";
import { AppError } from "../../utils/safe-error.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    requestId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url
  };
}

export async function simulateApprovedPaymentController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!isDevelopment) {
    throw new AppError(404, "NOT_FOUND", "Recurso nao encontrado.");
  }

  const result = await ordersService.simulateApprovedPaymentForCurrentUser(
    request.body,
    request.cookies,
    getRequestInfo(request)
  );

  reply.send(result);
}
