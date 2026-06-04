import type { FastifyReply, FastifyRequest } from "fastify";

import { sessionCookieName } from "../../config/cookies.js";
import {
  getHeaderValue,
  idempotencyKeySchema
} from "../idempotency/idempotency.utils.js";
import { authService } from "../auth/auth.service.js";
import { userRewardCycleService } from "./reward-cycle.service.js";
import {
  claimRewardTierBodySchema,
  rewardTierParamsSchema
} from "./rewards.schemas.js";

function getRequestInfo(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    requestId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url
  };
}

export async function getRewardScaleController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = await authService.getCurrentUser(
    request.cookies[sessionCookieName],
    getRequestInfo(request)
  );
  const scale = await userRewardCycleService.getCurrentScaleProgress(user.id);

  reply.send(scale);
}

export async function claimRewardTierController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = await authService.getCurrentUser(
    request.cookies[sessionCookieName],
    getRequestInfo(request)
  );
  const params = rewardTierParamsSchema.parse(request.params);
  const body = claimRewardTierBodySchema.parse(request.body ?? {});
  const idempotencyKey = idempotencyKeySchema.parse(
    getHeaderValue(request.headers["idempotency-key"])
  );
  const result = await userRewardCycleService.claimTier({
    userId: user.id,
    tierCode: params.tierCode,
    body,
    idempotencyKey,
    requestInfo: getRequestInfo(request)
  });

  reply.status(result.statusCode).send(result.body);
}
