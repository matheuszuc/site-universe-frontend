import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { createOrderController } from "./orders.controller.js";

export async function ordersRoutes(app: FastifyInstance) {
  app.post(
    "/",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType]
    },
    createOrderController
  );
}
