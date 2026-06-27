import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { gfDatabaseService } from "../game-delivery/gf-database.service.js";
import { getClassName } from "./class-map.js";
import { buildBaselineMap, computeMonthlyEntries } from "./ranking-monthly.js";

export type RankingEntry = {
  position: number;
  playerName: string;
  className: string;
  points: number;
  winCount: number;
  loseCount: number;
  mvpCount: number;
};

export type MonthlyRankingResult = {
  // false quando ainda nao existe snapshot (primeiro ciclo, cron nao rodou). O
  // frontend usa isto para exibir a mensagem "disponivel a partir do dia 4".
  available: boolean;
  ranking: RankingEntry[];
};

export type ChampionEntry = {
  position: number;
  playerName: string;
  className: string;
  points: number;
  winCount: number;
  loseCount: number;
  mvpCount: number;
  championMonth: number;
  championYear: number;
};

function normalizeSearch(search: string | undefined) {
  if (typeof search !== "string") {
    return null;
  }

  const trimmed = search.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function matchesSearch(playerName: string, search: string | null) {
  if (!search) {
    return true;
  }

  return playerName.toLowerCase().includes(search.toLowerCase());
}

export class RankingService {
  // Top 50 do Hall da Fama (acumulado). Publico e tolerante a falha: se a entrega
  // ao jogo estiver desligada, o banco GF nao estiver configurado, ou a consulta
  // falhar, retorna lista vazia em vez de quebrar o site.
  async getMvpRanking(search: string | undefined): Promise<RankingEntry[]> {
    if (!env.GAME_DELIVERY_ENABLED || !gfDatabaseService.isConfigured()) {
      return [];
    }

    try {
      const rows = await gfDatabaseService.getBattlefieldRanking(normalizeSearch(search));

      return rows.map((row, index) => ({
        position: index + 1,
        playerName: row.player_name,
        className: getClassName(Number(row.player_class)),
        points: Number(row.points),
        winCount: Number(row.win_count),
        loseCount: Number(row.lose_count),
        mvpCount: Number(row.mvp_count)
      }));
    } catch (error) {
      console.error("Falha ao carregar ranking do Hall da Fama", error);
      return [];
    }
  }

  // Ranking do ciclo atual: diferenca entre o battlefield_career de agora e o snapshot
  // mais recente (tirado no ultimo dia 4). available=false quando nao ha snapshot.
  async getMonthlyRanking(search: string | undefined): Promise<MonthlyRankingResult> {
    if (!env.GAME_DELIVERY_ENABLED || !gfDatabaseService.isConfigured()) {
      return { available: false, ranking: [] };
    }

    const latest = await this.getLatestSnapshotMeta();

    if (!latest) {
      return { available: false, ranking: [] };
    }

    try {
      const [snapshotRows, currentRows] = await Promise.all([
        prisma.rankingMonthlySnapshot.findMany({
          where: { snapshotMonth: latest.snapshotMonth, snapshotYear: latest.snapshotYear },
          select: { playerName: true, winCount: true, loseCount: true, mvpCount: true }
        }),
        gfDatabaseService.getAllBattlefieldCareer()
      ]);

      const baseline = buildBaselineMap(snapshotRows);
      const normalizedSearch = normalizeSearch(search);
      const ranking = computeMonthlyEntries(baseline, currentRows)
        .filter((entry) => matchesSearch(entry.playerName, normalizedSearch))
        .slice(0, 50)
        .map((entry, index) => ({
          position: index + 1,
          playerName: entry.playerName,
          className: getClassName(entry.playerClass),
          points: entry.points,
          winCount: entry.winCount,
          loseCount: entry.loseCount,
          mvpCount: entry.mvpCount
        }));

      return { available: true, ranking };
    } catch (error) {
      console.error("Falha ao carregar ranking mensal", error);
      // Snapshot existe, mas o GF caiu: degrada para lista vazia sem quebrar o site.
      return { available: true, ranking: [] };
    }
  }

  // Top 10 campeoes ja congelados de um mes/ano. Default: mes anterior ao atual.
  async getChampions(month: number | undefined, year: number | undefined): Promise<ChampionEntry[]> {
    const target = this.resolveChampionPeriod(month, year);

    const champions = await prisma.rankingMonthlyChampion.findMany({
      where: { championMonth: target.month, championYear: target.year },
      orderBy: { position: "asc" }
    });

    return champions.map((champion) => ({
      position: champion.position,
      playerName: champion.playerName,
      className: getClassName(champion.playerClass),
      points: champion.points,
      winCount: champion.winCount,
      loseCount: champion.loseCount,
      mvpCount: champion.mvpCount,
      championMonth: champion.championMonth,
      championYear: champion.championYear
    }));
  }

  // Snapshot mais recente por (ano, mes). Usado como baseline do ciclo atual.
  private async getLatestSnapshotMeta() {
    return prisma.rankingMonthlySnapshot.findFirst({
      orderBy: [{ snapshotYear: "desc" }, { snapshotMonth: "desc" }],
      select: { snapshotMonth: true, snapshotYear: true }
    });
  }

  private resolveChampionPeriod(month: number | undefined, year: number | undefined) {
    if (typeof month === "number" && typeof year === "number") {
      return { month, year };
    }

    // Default: mes anterior ao atual.
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return { month: previous.getMonth() + 1, year: previous.getFullYear() };
  }
}

export const rankingService = new RankingService();
