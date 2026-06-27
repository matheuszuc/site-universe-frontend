import type { BattlefieldCareerSnapshotRow } from "../game-delivery/gf-database.service.js";

// Linha de baseline (snapshot do inicio do ciclo) ja normalizada por nome.
export type BaselineCounts = {
  joinCount: number;
  winCount: number;
  loseCount: number;
  mvpCount: number;
};

// Resultado do calculo mensal para um jogador (valores FEITOS NO CICLO).
export type MonthlyComputedEntry = {
  playerName: string;
  playerClass: number;
  points: number;
  winCount: number;
  loseCount: number;
  mvpCount: number;
};

// Diferenca por campo, ciente do reset manual do servidor (~dia 5). Enquanto os
// contadores so crescem (antes do reset), a diferenca = atual - baseline. Depois do
// reset, o atual fica MENOR que o snapshot; nesse caso o ciclo recomecou do zero e o
// proprio valor atual ja representa o que foi feito no ciclo. Nunca retorna negativo.
function fieldDiff(current: number, baseline: number) {
  return current >= baseline ? current - baseline : current;
}

export function buildBaselineMap(
  rows: {
    playerName: string;
    joinCount: number;
    winCount: number;
    loseCount: number;
    mvpCount: number;
  }[]
) {
  const baseline = new Map<string, BaselineCounts>();

  for (const row of rows) {
    baseline.set(row.playerName, {
      joinCount: row.joinCount,
      winCount: row.winCount,
      loseCount: row.loseCount,
      mvpCount: row.mvpCount
    });
  }

  return baseline;
}

// Calcula os pontos feitos no ciclo para cada jogador atual e ordena por pontos DESC.
// Formula: (win_diff * 2) - (lose_diff * 3) + (mvp_diff * 1) - (quit_diff * 3),
// onde quit_diff = join_diff - win_diff - lose_diff (entrou na arena mas nao terminou).
export function computeMonthlyEntries(
  baseline: Map<string, BaselineCounts>,
  currentRows: BattlefieldCareerSnapshotRow[]
): MonthlyComputedEntry[] {
  const entries = currentRows.map((row) => {
    const base = baseline.get(row.player_name);
    const joinDiff = fieldDiff(row.join_count, base?.joinCount ?? 0);
    const winDiff = fieldDiff(row.win_count, base?.winCount ?? 0);
    const loseDiff = fieldDiff(row.lose_count, base?.loseCount ?? 0);
    const mvpDiff = fieldDiff(row.mvp_count, base?.mvpCount ?? 0);
    const quitDiff = joinDiff - winDiff - loseDiff;

    return {
      playerName: row.player_name,
      playerClass: Number(row.player_class),
      points: winDiff * 2 - loseDiff * 3 + mvpDiff * 1 - quitDiff * 3,
      winCount: winDiff,
      loseCount: loseDiff,
      mvpCount: mvpDiff
    };
  });

  return entries.sort((a, b) => b.points - a.points);
}
