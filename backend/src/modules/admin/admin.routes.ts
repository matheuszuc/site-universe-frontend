import type { FastifyInstance } from "fastify";

import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import {
  getAdminAuditLogsController,
  getAdminGameDeliveriesController,
  getAdminMeController,
  getAdminOrdersController,
  getAdminUsersController
} from "./admin.controller.js";

const preHandler = [requireAllowedOrigin, requireAdmin];

export async function adminRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler }, getAdminMeController);
  app.get("/users", { preHandler }, getAdminUsersController);
  app.get("/orders", { preHandler }, getAdminOrdersController);
  app.get("/game-deliveries", { preHandler }, getAdminGameDeliveriesController);
  app.get("/audit-logs", { preHandler }, getAdminAuditLogsController);
}
