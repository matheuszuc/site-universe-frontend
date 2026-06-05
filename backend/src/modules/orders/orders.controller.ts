import type { FastifyReply, FastifyRequest } from "fastify";

import { ordersService } from "./orders.service.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    requestId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url
  };
}

export async function createOrderController(request: FastifyRequest, reply: FastifyReply) {
  const result = await ordersService.createOrder(
    request.body,
    request.cookies,
    request.headers["idempotency-key"],
    getRequestInfo(request)
  );

  reply.status(result.statusCode).send(result.body);
}

export async function listCurrentUserOrdersController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await ordersService.listCurrentUserOrders(request.cookies, getRequestInfo(request));

  reply.send(result);
}

export async function getCurrentUserOrderStatusController(
  request: FastifyRequest<{
    Params: {
      orderNumber: string;
    };
  }>,
  reply: FastifyReply
) {
  const result = await ordersService.getCurrentUserOrderStatus(
    request.params.orderNumber,
    request.cookies,
    getRequestInfo(request)
  );

  reply.send(result);
}
