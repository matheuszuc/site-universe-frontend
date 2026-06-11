import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../config/env.js";
import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { AppError } from "../../utils/safe-error.js";
import { accountMigrationRateLimit } from "../security/rate-limit.js";
import {
  accountMigrationStatusController,
  completeAccountMigrationController,
  startAccountMigrationController
} from "./account-migration.controller.js";

function requireMigrationEnabled(_req: FastifyRequest, _reply: FastifyReply) {
  if (!env.ACCOUNT_MIGRATION_ENABLED) {
    throw new AppError(403, "MIGRATION_DISABLED", "Migração de conta encerrada.");
  }
}

export async function accountMigrationRoutes(app: FastifyInstance) {
  app.post(
    "/start",
    {
      preHandler: [requireMigrationEnabled, requireAllowedOrigin, requireJsonContentType, accountMigrationRateLimit]
    },
    startAccountMigrationController
  );
  app.post(
    "/complete",
    {
      preHandler: [requireMigrationEnabled, requireAllowedOrigin, requireJsonContentType, accountMigrationRateLimit]
    },
    completeAccountMigrationController
  );
  app.get(
    "/status",
    {
      preHandler: [requireMigrationEnabled, requireAllowedOrigin]
    },
    accountMigrationStatusController
  );
}
