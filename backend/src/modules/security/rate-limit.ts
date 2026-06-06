import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../config/env.js";
import { normalizeEmail } from "../../utils/normalize-email.js";
import { AppError } from "../../utils/safe-error.js";
import { securityEventsService } from "./security-events.service.js";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type ConsumeRateLimitInput = {
  key: string;
  max: number;
  window: string;
};

const buckets = new Map<string, RateLimitBucket>();

function parseWindowToMs(window: string) {
  const normalizedWindow = window.trim().toLowerCase();
  const match = normalizedWindow.match(/^(\d+)\s*(ms|millisecond|milliseconds|s|sec|second|seconds|m|min|minute|minutes|h|hour|hours)$/);

  if (!match) {
    return 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "ms" || unit === "millisecond" || unit === "milliseconds") {
    return value;
  }

  if (unit === "s" || unit === "sec" || unit === "second" || unit === "seconds") {
    return value * 1000;
  }

  if (unit === "m" || unit === "min" || unit === "minute" || unit === "minutes") {
    return value * 60 * 1000;
  }

  return value * 60 * 60 * 1000;
}

export function consumeRateLimit(input: ConsumeRateLimitInput) {
  const now = Date.now();
  const windowMs = parseWindowToMs(input.window);
  const currentBucket = buckets.get(input.key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }

  if (currentBucket.count >= input.max) {
    return false;
  }

  currentBucket.count += 1;
  return true;
}

function getEmailFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("email" in body)) {
    return null;
  }

  const email = (body as { email?: unknown }).email;

  if (typeof email !== "string") {
    return null;
  }

  return normalizeEmail(email);
}

function getGameLoginFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("gameLogin" in body)) {
    return null;
  }

  const gameLogin = (body as { gameLogin?: unknown }).gameLogin;

  if (typeof gameLogin !== "string") {
    return null;
  }

  return gameLogin.trim().toLowerCase();
}

function buildRateLimitError(message: string) {
  return new AppError(429, "RATE_LIMITED", message);
}

export async function loginRateLimit(request: FastifyRequest, _reply: FastifyReply) {
  const email = getEmailFromBody(request.body);
  const keys = [`login:ip:${request.ip}`];

  if (email) {
    keys.push(`login:email:${email}`);
  }

  const allowed = keys.every((key) =>
    consumeRateLimit({
      key,
      max: env.LOGIN_RATE_LIMIT_MAX,
      window: env.LOGIN_RATE_LIMIT_WINDOW
    })
  );

  if (!allowed) {
    await securityEventsService.record({
      eventType: "LOGIN_BLOCKED_RATE_LIMIT",
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      metadata: email ? { email } : undefined
    });

    throw buildRateLimitError("Muitas requisições. Tente novamente em instantes.");
  }
}

export async function registerRateLimit(request: FastifyRequest, _reply: FastifyReply) {
  const allowed = consumeRateLimit({
    key: `register:ip:${request.ip}`,
    max: env.REGISTER_RATE_LIMIT_MAX,
    window: env.REGISTER_RATE_LIMIT_WINDOW
  });

  if (!allowed) {
    await securityEventsService.record({
      eventType: "REGISTER_BLOCKED_RATE_LIMIT",
      ip: request.ip,
      userAgent: request.headers["user-agent"]
    });

    throw buildRateLimitError("Muitas tentativas. Tente novamente em instantes.");
  }
}

export async function emailVerificationRateLimit(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const email = getEmailFromBody(request.body);
  const keys = [`email-verification:ip:${request.ip}`];

  if (email) {
    keys.push(`email-verification:email:${email}`);
  }

  const allowed = keys.every((key) =>
    consumeRateLimit({
      key,
      max: env.EMAIL_VERIFICATION_RATE_LIMIT_MAX,
      window: env.EMAIL_VERIFICATION_RATE_LIMIT_WINDOW
    })
  );

  if (!allowed) {
    throw buildRateLimitError("Muitas tentativas. Tente novamente em instantes.");
  }
}

export async function passwordResetRateLimit(request: FastifyRequest, _reply: FastifyReply) {
  const email = getEmailFromBody(request.body);
  const keys = [`password-reset:ip:${request.ip}`];

  if (email) {
    keys.push(`password-reset:email:${email}`);
  }

  const allowed = keys.every((key) =>
    consumeRateLimit({
      key,
      max: env.PASSWORD_RESET_RATE_LIMIT_MAX,
      window: env.PASSWORD_RESET_RATE_LIMIT_WINDOW
    })
  );

  if (!allowed) {
    throw buildRateLimitError("Muitas tentativas. Tente novamente em instantes.");
  }
}

export async function accountMigrationRateLimit(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const gameLogin = getGameLoginFromBody(request.body);
  const keys = [`account-migration:ip:${request.ip}`];

  if (gameLogin) {
    keys.push(`account-migration:login:${gameLogin}`);
  }

  const allowed = keys.every((key) =>
    consumeRateLimit({
      key,
      max: env.ACCOUNT_MIGRATION_RATE_LIMIT_MAX,
      window: env.ACCOUNT_MIGRATION_RATE_LIMIT_WINDOW
    })
  );

  if (!allowed) {
    await securityEventsService.record({
      eventType: "ACCOUNT_MIGRATION_BLOCKED_RATE_LIMIT",
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      metadata: gameLogin ? { gameLogin } : undefined
    });

    throw buildRateLimitError("Muitas tentativas. Tente novamente em instantes.");
  }
}
