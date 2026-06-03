import type { FastifyInstance } from "fastify";

import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { getCurrentUserDashboardController } from "./dashboard.controller.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/me/dashboard",
    {
      preHandler: [requireAllowedOrigin]
    },
    getCurrentUserDashboardController
  );
}
