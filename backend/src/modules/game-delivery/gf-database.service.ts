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

function isGfDatabaseConfigured() {
  return Boolean(env.GF_DB_HOST && env.GF_DB_USER && env.GF_DB_PASSWORD);
}

export class GfDatabaseService {
  private gamePool: pg.Pool | null = null;
  private accountPool: pg.Pool | null = null;

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
}

export const gfDatabaseService = new GfDatabaseService();
