import type { FastifyInstance } from "fastify";

import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { rankingRateLimit } from "../security/rate-limit.js";
import {
  getAdminChampionsController,
  getMonthlyMvpRankingController,
  getMvpRankingController
} from "./ranking.controller.js";

// Rotas publicas do Hall da Fama (prefixo /api/ranking). Sem autenticacao: qualquer
// visitante pode ver o ranking. Protegidas apenas por rate limit (30 req/min por IP).
export async function rankingRoutes(app: FastifyInstance) {
  app.get(
    "/mvp",
    {
      preHandler: [rankingRateLimit]
    },
    getMvpRankingController
  );

  app.get(
    "/mvp/monthly",
    {
      preHandler: [rankingRateLimit]
    },
    getMonthlyMvpRankingController
  );
}

// Rotas de ranking do painel admin (prefixo /api/admin/ranking). Somente leitura,
// protegidas por requireAdmin.
export async function adminRankingRoutes(app: FastifyInstance) {
  app.get(
    "/champions",
    {
      preHandler: [requireAllowedOrigin, requireAdmin]
    },
    getAdminChampionsController
  );
}
