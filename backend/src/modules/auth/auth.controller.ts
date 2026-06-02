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

function getSingleHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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
  const csrfToken = getSingleHeaderValue(request.headers["x-csrf-token"]);

  await authService.logout(sessionToken, csrfToken, getRequestInfo(request));

  reply
    .clearCookie(sessionCookieName, getClearSessionCookieOptions())
    .send({ success: true });
}

export async function resendVerificationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await authService.resendVerification(request.body, getRequestInfo(request));

  reply.send(result);
}

export async function verifyEmailController(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.verifyEmail(request.query, getRequestInfo(request));

  reply.send(result);
}

export async function forgotPasswordController(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.forgotPassword(request.body, getRequestInfo(request));

  reply.send(result);
}

export async function resetPasswordController(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.resetPassword(request.body, getRequestInfo(request));

  reply.send(result);
}

export async function csrfController(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];
  const csrfToken = await authService.issueCsrfToken(sessionToken, getRequestInfo(request));

  reply.send({ csrfToken });
}

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies[sessionCookieName];
  const user = await authService.getCurrentUser(sessionToken, getRequestInfo(request));

  reply.send({ user });
}
