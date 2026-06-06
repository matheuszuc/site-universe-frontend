import type { FastifyReply, FastifyRequest } from "fastify";

import {
  accountMigrationCookieName,
  getAccountMigrationCookieOptions,
  getClearAccountMigrationCookieOptions
} from "../../config/cookies.js";
import { accountMigrationService } from "./account-migration.service.js";

function normalizeHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: normalizeHeaderValue(request.headers["user-agent"])
  };
}

export async function startAccountMigrationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await accountMigrationService.start(request.body, getRequestInfo(request));

  reply
    .setCookie(
      accountMigrationCookieName,
      result.migrationToken,
      getAccountMigrationCookieOptions()
    )
    .send(result.body);
}

export async function completeAccountMigrationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await accountMigrationService.complete(
    request.body,
    request.cookies[accountMigrationCookieName],
    getRequestInfo(request)
  );

  reply
    .clearCookie(accountMigrationCookieName, getClearAccountMigrationCookieOptions())
    .send(result);
}

export async function accountMigrationStatusController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const status = await accountMigrationService.status(
    request.cookies[accountMigrationCookieName]
  );

  reply.send(status);
}
