import type { FastifyInstance } from "fastify";

import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { listStorePackagesController } from "./store.controller.js";

export async function storeRoutes(app: FastifyInstance) {
  app.get(
    "/packages",
    {
      preHandler: [requireAllowedOrigin]
    },
    listStorePackagesController
  );
}
