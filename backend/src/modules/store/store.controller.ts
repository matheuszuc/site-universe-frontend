import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../../config/cookies.js";
import { authService } from "../auth/auth.service.js";
import { storePackageService } from "./store.service.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"]
  };
}

export async function listStorePackagesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authService.getCurrentUser(request.cookies[sessionCookieName], getRequestInfo(request));
  const packages = await storePackageService.listActivePackages();

  reply.send({
    packages
  });
}
