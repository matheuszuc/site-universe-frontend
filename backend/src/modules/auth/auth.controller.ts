import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getClearSessionCookieOptions,
  sessionCookieName
} from "../../config/cookies.js";
import { authService } from "./auth.service.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"]
  };
}

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const user = await authService.register(request.body, getRequestInfo(request));

  reply.status(201).send({ user });
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.login(request.body, getRequestInfo(request));

  reply
    .setCookie(sessionCookieName, result.sessionToken, result.cookieOptions)
    .send({ user: result.user });
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];

  await authService.logout(sessionToken, getRequestInfo(request));

  reply
    .clearCookie(sessionCookieName, getClearSessionCookieOptions())
    .send({ success: true });
}

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];
  const user = await authService.getCurrentUser(sessionToken, getRequestInfo(request));

  reply.send({ user });
}
