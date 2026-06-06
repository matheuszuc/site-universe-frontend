import type { FastifyInstance } from "fastify";

import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { getAdminMeController } from "./admin.controller.js";

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    {
      preHandler: [requireAllowedOrigin, requireAdmin]
    },
    getAdminMeController
  );
}
