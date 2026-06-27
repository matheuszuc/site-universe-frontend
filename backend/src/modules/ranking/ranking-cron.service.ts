import cron from "node-cron";

import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { gfDatabaseService } from "../game-delivery/gf-database.service.js";
import { buildBaselineMap, computeMonthlyEntries } from "./ranking-monthly.js";

// Dia 4 de cada mes, 00:00 (meia-noite entre o dia 3 e o dia 4). O snapshot e tirado
// antes do reset manual do servidor (~dia 5), congelando os campeoes do ciclo que
// esta encerrando.
const RANKING_CRON_EXPRESSION = "0 0 4 * *";

// Snapshots com mais de 13 meses sao descartados na limpeza automatica.
const SNAPSHOT_RETENTION_MONTHS = 13;

const TOP_CHAMPIONS = 10;

// Executa o fechamento mensal do ranking. Exportado para permitir teste/execucao
// manual. Nunca lanca: em falha (ex.: GF fora do ar), loga e encerra graciosamente
// para nao travar o servidor.
export async function runMonthlyRankingJob(now = new Date()) {
  console.log("ranking monthly cron started");

  if (!env.GAME_DELIVERY_ENABLED || !gfDatabaseService.isConfigured()) {
    console.warn("ranking monthly cron skipped: GF delivery disabled or not configured");
    return;
  }

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    // Dados atuais do banco do jogo. Se o GF estiver fora, aborta sem efeitos.
    const currentRows = await gfDatabaseService.getAllBattlefieldCareer();

    // PASSO 1 — Campeoes do ciclo que encerra: baseline = snapshot mais recente que
    // NAO seja deste mes (evita baseline zerado em reexecucao no mesmo dia).
    const baselineMeta = await prisma.rankingMonthlySnapshot.findFirst({
      where: { NOT: { snapshotMonth: month, snapshotYear: year } },
      orderBy: [{ snapshotYear: "desc" }, { snapshotMonth: "desc" }],
      select: { snapshotMonth: true, snapshotYear: true }
    });

    const baselineRows = baselineMeta
      ? await prisma.rankingMonthlySnapshot.findMany({
          where: {
            snapshotMonth: baselineMeta.snapshotMonth,
            snapshotYear: baselineMeta.snapshotYear
          },
          select: {
            playerName: true,
            joinCount: true,
            winCount: true,
            loseCount: true,
            mvpCount: true
          }
        })
      : [];

    const champions = baselineMeta
      ? computeMonthlyEntries(buildBaselineMap(baselineRows), currentRows)
          .slice(0, TOP_CHAMPIONS)
          .map((entry, index) => ({
            position: index + 1,
            playerName: entry.playerName,
            playerClass: entry.playerClass,
            points: entry.points,
            winCount: entry.winCount,
            loseCount: entry.loseCount,
            mvpCount: entry.mvpCount,
            championMonth: month,
            championYear: year
          }))
      : [];

    const retentionCutoff = new Date(now);
    retentionCutoff.setMonth(retentionCutoff.getMonth() - SNAPSHOT_RETENTION_MONTHS);

    // PASSO 1 + PASSO 2 atomicos: ou campeoes + snapshot do novo ciclo entram juntos,
    // ou nada entra. Reexecucao no mesmo mes substitui os registros (idempotente).
    await prisma.$transaction(async (tx) => {
      await tx.rankingMonthlyChampion.deleteMany({
        where: { championMonth: month, championYear: year }
      });

      if (champions.length > 0) {
        await tx.rankingMonthlyChampion.createMany({ data: champions });
      }

      await tx.rankingMonthlySnapshot.deleteMany({
        where: { snapshotMonth: month, snapshotYear: year }
      });

      await tx.rankingMonthlySnapshot.createMany({
        data: currentRows.map((row) => ({
          playerName: row.player_name,
          playerClass: Number(row.player_class),
          joinCount: row.join_count,
          winCount: row.win_count,
          loseCount: row.lose_count,
          mvpCount: row.mvp_count,
          snapshotMonth: month,
          snapshotYear: year
        }))
      });

      await tx.rankingMonthlySnapshot.deleteMany({
        where: { createdAt: { lt: retentionCutoff } }
      });
    });

    if (champions.length > 0) {
      console.log(`champions saved: ${month}/${year}`);
    }
    console.log(`snapshot saved: ${currentRows.length} players`);
  } catch (error) {
    console.error("ranking monthly cron failed", error);
  }
}

// Registra o agendamento. Chamado uma vez no boot do servidor.
export function registerRankingCron() {
  cron.schedule(RANKING_CRON_EXPRESSION, () => {
    void runMonthlyRankingJob();
  });
}
