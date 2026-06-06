import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { accountMigrationRateLimit } from "../security/rate-limit.js";
import {
  accountMigrationStatusController,
  completeAccountMigrationController,
  startAccountMigrationController
} from "./account-migration.controller.js";

export async function accountMigrationRoutes(app: FastifyInstance) {
  app.post(
    "/start",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, accountMigrationRateLimit]
    },
    startAccountMigrationController
  );
  app.post(
    "/complete",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, accountMigrationRateLimit]
    },
    completeAccountMigrationController
  );
  app.get(
    "/status",
    {
      preHandler: [requireAllowedOrigin]
    },
    accountMigrationStatusController
  );
}
