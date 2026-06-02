import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../../config/cookies.js";
import { authService } from "./auth.service.js";

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];
  const user = await authService.getCurrentUser(sessionToken);

  reply.send({ user });
}
