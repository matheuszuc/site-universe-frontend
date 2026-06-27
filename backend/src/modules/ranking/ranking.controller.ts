import type { FastifyReply, FastifyRequest } from "fastify";

import { rankingService } from "./ranking.service.js";

function getSearchParam(query: unknown) {
  if (!query || typeof query !== "object" || !("search" in query)) {
    return undefined;
  }

  const search = (query as { search?: unknown }).search;

  return typeof search === "string" ? search : undefined;
}

// Le um inteiro positivo de um query param (string), ou undefined se ausente/invalido.
function getIntParam(query: unknown, key: string) {
  if (!query || typeof query !== "object" || !(key in query)) {
    return undefined;
  }

  const raw = (query as Record<string, unknown>)[key];

  if (typeof raw !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isInteger(parsed) ? parsed : undefined;
}

export async function getMvpRankingController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ranking = await rankingService.getMvpRanking(getSearchParam(request.query));

  reply.send({
    ranking
  });
}

export async function getMonthlyMvpRankingController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const result = await rankingService.getMonthlyRanking(getSearchParam(request.query));

  reply.send(result);
}

export async function getAdminChampionsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const month = getIntParam(request.query, "month");
  const year = getIntParam(request.query, "year");
  const validMonth = typeof month === "number" && month >= 1 && month <= 12 ? month : undefined;
  const validYear = typeof year === "number" && year >= 2000 && year <= 2100 ? year : undefined;

  const champions = await rankingService.getChampions(validMonth, validYear);

  reply.send({
    champions
  });
}
