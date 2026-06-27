import pg from "pg";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/safe-error.js";

const { Pool } = pg;

type CreditApInput = {
  accountName: string;
  apAmount: number;
};

type InsertRewardBoxInput = {
  accountName: string;
  itemId: number;
  itemQuantity: number;
  point: number;
};

export type BattlefieldCareerRow = {
  player_name: string;
  player_class: number;
  join_count: number;
  win_count: number;
  lose_count: number;
  mvp_count: number;
  points: number;
};

export type BattlefieldCareerSnapshotRow = {
  player_name: string;
  player_class: number;
  join_count: number;
  win_count: number;
  lose_count: number;
  mvp_count: number;
};

// IDs de box por rank da Reward Scale, confirmados pelo time do jogo. Allowlist de
// defesa-em-profundidade: mesmo que reward_tiers.box_game_item_id seja alterado no
// banco (erro ou ataque), nenhum item fora desta lista chega ao item_receivable.
// Rank 1=60045, Rank 2=60046, Rank 3=60047, Rank 4=60048, Rank 5=60049, Rank 6=60050
export const ALLOWED_REWARD_BOX_ITEM_IDS = new Set([60045, 60046, 60047, 60048, 60049, 60050]);

function isGfDatabaseConfigured() {
  return Boolean(env.GF_DB_HOST && env.GF_DB_USER && env.GF_DB_PASSWORD);
}

export class GfDatabaseService {
  private gamePool: pg.Pool | null = null;
  private accountPool: pg.Pool | null = null;
  private statsPool: pg.Pool | null = null;

  isConfigured() {
    return isGfDatabaseConfigured();
  }

  // Leitura publica do ranking de Hall da Fama (battlefield_career). Somente SELECT,
  // sem dados sensiveis. O LIMIT fixo (50) e parametrizacao protegem contra abuso.
  async getBattlefieldRanking(search: string | null) {
    const result = await this.getStatsPool().query<BattlefieldCareerRow>(
      `
        SELECT
          player_name,
          player_class,
          join_count,
          win_count,
          lose_count,
          mvp_count,
          ((win_count * 2) - (lose_count * 3) + (mvp_count * 1)
           - ((join_count - win_count - lose_count) * 3)) AS points
        FROM battlefield_career
        WHERE ($1::text IS NULL OR player_name ILIKE '%' || $1 || '%')
        ORDER BY points DESC
        LIMIT 50
      `,
      [search]
    );

    return result.rows;
  }

  // Leitura completa (sem LIMIT) do battlefield_career, usada pelo snapshot mensal
  // e pelo calculo do ranking do ciclo. Somente SELECT, sem dados sensiveis.
  async getAllBattlefieldCareer() {
    const result = await this.getStatsPool().query<BattlefieldCareerSnapshotRow>(
      `
        SELECT
          player_name,
          player_class,
          join_count,
          win_count,
          lose_count,
          mvp_count
        FROM battlefield_career
      `
    );

    return result.rows;
  }

  async creditAp(input: CreditApInput) {
    if (input.apAmount <= 0) {
      throw new AppError(409, "CONFLICT", "Quantidade de AP invalida.");
    }

    const result = await this.getGamePool().query(
      `
        UPDATE tb_user
        SET pvalues = COALESCE(pvalues, 0) + $1
        WHERE mid = $2
      `,
      [input.apAmount, input.accountName]
    );

    if (result.rowCount !== 1) {
      throw new AppError(409, "CONFLICT", "Conta GF nao encontrada.");
    }
  }

  async insertRewardBox(input: InsertRewardBoxInput) {
    if (input.itemId <= 0 || input.itemQuantity <= 0 || input.point < 0) {
      throw new AppError(409, "CONFLICT", "Entrega de recompensa invalida.");
    }

    // Ultima linha de defesa antes da escrita no banco do jogo: rejeita qualquer
    // itemId fora da allowlist (violacao de integridade), logando antes do throw.
    if (!ALLOWED_REWARD_BOX_ITEM_IDS.has(input.itemId)) {
      console.error("reward box item id rejeitado pela allowlist", {
        itemId: input.itemId
      });
      throw new AppError(409, "CONFLICT", "Recompensa indisponivel no momento.");
    }

    await this.getAccountPool().query(
      `
        INSERT INTO item_receivable (account_name, item_id, item_quantity, point)
        VALUES ($1, $2, $3, $4)
      `,
      [input.accountName, input.itemId, input.itemQuantity, input.point]
    );
  }

  private createPool(database: string) {
    if (!isGfDatabaseConfigured()) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Banco GF nao configurado.");
    }

    return new Pool({
      host: env.GF_DB_HOST,
      port: env.GF_DB_PORT,
      user: env.GF_DB_USER,
      password: env.GF_DB_PASSWORD,
      database,
      ssl: env.GF_DB_SSL === true ? { rejectUnauthorized: true } : false
    });
  }

  private getGamePool() {
    if (!this.gamePool) {
      this.gamePool = this.createPool(env.GF_DB_NAME);
    }

    return this.gamePool;
  }

  private getAccountPool() {
    if (!this.accountPool) {
      this.accountPool = this.createPool(env.GF_ACCOUNT_DB_NAME);
    }

    return this.accountPool;
  }

  private getStatsPool() {
    if (!this.statsPool) {
      this.statsPool = this.createPool(env.GF_STATS_DB_NAME);
    }

    return this.statsPool;
  }
}

export const gfDatabaseService = new GfDatabaseService();
