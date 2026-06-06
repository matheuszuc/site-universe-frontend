import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import {
  claimRewardTierController,
  getRewardScaleController
} from "./rewards.controller.js";

export async function rewardsRoutes(app: FastifyInstance) {
  app.get(
    "/scale",
    {
      preHandler: [requireAllowedOrigin]
    },
    getRewardScaleController
  );
  app.post(
    "/tiers/:tierCode/claim",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType]
    },
    claimRewardTierController
  );
}
