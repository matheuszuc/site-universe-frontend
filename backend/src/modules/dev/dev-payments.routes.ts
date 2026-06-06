import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { simulateApprovedPaymentController } from "./dev-payments.controller.js";

export async function devPaymentsRoutes(app: FastifyInstance) {
  app.post(
    "/simulate-approved",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType]
    },
    simulateApprovedPaymentController
  );
}
