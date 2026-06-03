import type { FastifyReply, FastifyRequest } from "fastify";

import { dashboardService } from "./dashboard.service.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"]
  };
}

export async function getCurrentUserDashboardController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const dashboard = await dashboardService.getCurrentUserDashboard(
    request.cookies,
    getRequestInfo(request)
  );

  reply.send(dashboard);
}
