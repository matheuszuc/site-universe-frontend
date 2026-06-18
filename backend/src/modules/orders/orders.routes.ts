import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { requireCsrf } from "../../middlewares/require-csrf.js";
import {
  createOrderController,
  getCurrentUserOrderStatusController,
  listCurrentUserOrdersController
} from "./orders.controller.js";

export async function ordersRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [requireAllowedOrigin] }, listCurrentUserOrdersController);
  app.get<{ Params: { orderNumber: string } }>(
    "/:orderNumber/status",
    { preHandler: [requireAllowedOrigin] },
    getCurrentUserOrderStatusController
  );

  app.post(
    "/",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, requireCsrf]
    },
    createOrderController
  );
}
