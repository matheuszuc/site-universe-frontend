import { createHash, timingSafeEqual } from "node:crypto";

import pg from "pg";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/safe-error.js";

const { Pool } = pg;

const gfUnavailableMessage =
  "Nao foi possivel concluir a integracao com o jogo no momento. Tente novamente em instantes.";

type PasswordHashSource = "gf_ls.accounts.password" | "gf_ms.tb_user.password" | "gf_ms.tb_user.pwd";

export type VerifiedLegacyGameAccount = {
  gameLogin: string;
  gameAccountId: string;
  matchedPasswordSources: PasswordHashSource[];
  passwordHashState: "consistent" | "divergent";
};

export type CreatedLegacyGameAccount = {
  gameLogin: string;
  gameAccountId: string;
};

type LegacyUserRow = {
  mid: string;
  idnum: string | number;
  password: string | null;
  pwd: string | null;
};

type LegacyAccountRow = {
  username: string;
  password: string | null;
};

function isGfDatabaseConfigured() {
  return Boolean(env.GF_DB_HOST && env.GF_DB_USER && env.GF_DB_PASSWORD);
}

function isPgConnectionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EHOSTUNREACH" ||
    code === "ECONNRESET" ||
    message.includes("timeout") ||
    message.includes("connect")
  );
}

// Safe diagnostic log: connection error context only, never password/secret/DSN.
function logGfConnectionError(error: unknown, context: string) {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;

  console.warn("GF database unavailable", {
    context,
    code: typeof code === "string" ? code : undefined,
    message: error instanceof Error ? error.message : "unknown"
  });
}

function toGfUnavailableError(error: unknown, context: string) {
  if (error instanceof AppError) {
    return error;
  }

  if (isPgConnectionError(error)) {
    logGfConnectionError(error, context);
    return new AppError(503, "SERVICE_UNAVAILABLE", gfUnavailableMessage);
  }

  logGfConnectionError(error, context);
  return new AppError(503, "SERVICE_UNAVAILABLE", gfUnavailableMessage);
}

function md5Hex(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex");
}

function isMd5Hash(value: string | null | undefined) {
  return typeof value === "string" && /^[a-f0-9]{32}$/i.test(value);
}

function safeCompareHash(expectedHash: string | null | undefined, actualHash: string) {
  if (!isMd5Hash(expectedHash)) {
    return false;
  }

  const expected = Buffer.from((expectedHash as string).toLowerCase(), "hex");
  const actual = Buffer.from(actualHash.toLowerCase(), "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getPasswordHashState(hashes: Array<string | null | undefined>) {
  const validHashes = hashes
    .filter(isMd5Hash)
    .map((value) => (value as string).toLowerCase());

  return new Set(validHashes).size > 1 ? "divergent" : "consistent";
}

function getMatchedPasswordSources(input: {
  gfAccountPassword: string | null;
  gfUserPassword: string | null;
  gfUserPwd: string | null;
  currentPasswordHash: string;
}) {
  const sources: PasswordHashSource[] = [];

  if (safeCompareHash(input.gfAccountPassword, input.currentPasswordHash)) {
    sources.push("gf_ls.accounts.password");
  }

  if (safeCompareHash(input.gfUserPassword, input.currentPasswordHash)) {
    sources.push("gf_ms.tb_user.password");
  }

  if (safeCompareHash(input.gfUserPwd, input.currentPasswordHash)) {
    sources.push("gf_ms.tb_user.pwd");
  }

  return sources;
}

function normalizeLegacyAccount(input: {
  user: LegacyUserRow;
  account: LegacyAccountRow;
  matchedPasswordSources?: PasswordHashSource[];
}): VerifiedLegacyGameAccount {
  return {
    gameLogin: input.user.mid || input.account.username,
    gameAccountId: String(input.user.idnum),
    matchedPasswordSources: input.matchedPasswordSources ?? [],
    passwordHashState: getPasswordHashState([
      input.account.password,
      input.user.password,
      input.user.pwd
    ])
  };
}

export class GfLegacyAuthService {
  private gamePool: pg.Pool | null = null;
  private accountPool: pg.Pool | null = null;

  async findGameAccountByLogin(gameLogin: string): Promise<VerifiedLegacyGameAccount | null> {
    const legacyAccount = await this.findLegacyAccountRows(gameLogin);

    return legacyAccount ? normalizeLegacyAccount(legacyAccount) : null;
  }

  async verifyCredentials(input: {
    gameLogin: string;
    currentPassword: string;
  }): Promise<VerifiedLegacyGameAccount | null> {
    const legacyAccount = await this.findLegacyAccountRows(input.gameLogin);

    if (!legacyAccount) {
      return null;
    }

    const currentPasswordHash = md5Hex(input.currentPassword);
    const matchedPasswordSources = getMatchedPasswordSources({
      gfAccountPassword: legacyAccount.account.password,
      gfUserPassword: legacyAccount.user.password,
      gfUserPwd: legacyAccount.user.pwd,
      currentPasswordHash
    });

    return matchedPasswordSources.length > 0
      ? normalizeLegacyAccount({
          ...legacyAccount,
          matchedPasswordSources
        })
      : null;
  }

  // Creates a brand-new game account in the GF databases for site registration.
  // gf_ms.tb_user.idnum is auto-generated by the DB sequence and returned, then
  // reused as gf_ls.accounts.id. pvalues starts at 0. The site never stores this
  // MD5 hash; it only lives in the GF databases for in-game login compatibility.
  async createGameAccount(input: {
    gameLogin: string;
    password: string;
  }): Promise<CreatedLegacyGameAccount> {
    const existingAccount = await this.findAnyLegacyAccountByLogin(input.gameLogin);

    if (existingAccount) {
      throw new AppError(
        409,
        "CONFLICT",
        "Este login ja existe no jogo. Entre com sua conta do jogo para vincular ao site."
      );
    }

    const passwordHash = md5Hex(input.password);
    let gameClient: pg.PoolClient | null = null;
    let accountClient: pg.PoolClient | null = null;

    try {
      gameClient = await this.getGamePool().connect();
      accountClient = await this.getAccountPool().connect();

      await gameClient.query("BEGIN");
      await accountClient.query("BEGIN");

      const userResult = await gameClient.query<{ mid: string; idnum: number }>(
        `
          INSERT INTO tb_user (mid, password, pwd, pvalues)
          VALUES ($1, $2, $2, 0)
          RETURNING mid, idnum
        `,
        [input.gameLogin, passwordHash]
      );
      const createdUser = userResult.rows[0];

      if (!createdUser) {
        throw new AppError(503, "SERVICE_UNAVAILABLE", gfUnavailableMessage);
      }

      await accountClient.query(
        `
          INSERT INTO accounts (id, username, password, realname)
          VALUES ($1, $2, $3, $2)
        `,
        [createdUser.idnum, input.gameLogin, passwordHash]
      );

      await gameClient.query("COMMIT");
      await accountClient.query("COMMIT");

      return {
        gameLogin: createdUser.mid,
        gameAccountId: String(createdUser.idnum)
      };
    } catch (error) {
      await Promise.allSettled([
        gameClient?.query("ROLLBACK"),
        accountClient?.query("ROLLBACK")
      ]);

      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        throw new AppError(
          409,
          "CONFLICT",
          "Este login ja existe no jogo. Entre com sua conta do jogo para vincular ao site."
        );
      }

      throw toGfUnavailableError(error, "createGameAccount");
    } finally {
      gameClient?.release();
      accountClient?.release();
    }
  }

  async updateLegacyPassword(input: {
    gameLogin: string;
    gameAccountId: string;
    newPassword: string;
  }): Promise<void> {
    const gameClient = await this.getGamePool().connect();
    const accountClient = await this.getAccountPool().connect();
    const newPasswordHash = md5Hex(input.newPassword);

    try {
      await gameClient.query("BEGIN");
      await accountClient.query("BEGIN");

      const gameResult = await gameClient.query(
        `
          UPDATE tb_user
          SET password = $1,
              pwd = $1
          WHERE mid = $2
            AND idnum = $3
        `,
        [newPasswordHash, input.gameLogin, input.gameAccountId]
      );

      const accountResult = await accountClient.query(
        `
          UPDATE accounts
          SET password = $1
          WHERE username = $2
        `,
        [newPasswordHash, input.gameLogin]
      );

      if (gameResult.rowCount !== 1 || accountResult.rowCount !== 1) {
        throw new AppError(409, "CONFLICT", "Nao foi possivel atualizar a conta com estes dados.");
      }

      await accountClient.query("COMMIT");
      await gameClient.query("COMMIT");
    } catch (error) {
      await Promise.allSettled([
        gameClient.query("ROLLBACK"),
        accountClient.query("ROLLBACK")
      ]);
      throw error;
    } finally {
      gameClient.release();
      accountClient.release();
    }
  }

  private async findLegacyAccountRows(gameLogin: string) {
    const [user, account] = await Promise.all([
      this.findLegacyUserByLogin(gameLogin),
      this.findLegacyAccountByUsername(gameLogin)
    ]);

    if (!user || !account) {
      return null;
    }

    return {
      user,
      account
    };
  }

  private async findAnyLegacyAccountByLogin(gameLogin: string) {
    const [user, account] = await Promise.all([
      this.findLegacyUserByLogin(gameLogin),
      this.findLegacyAccountByUsername(gameLogin)
    ]);

    return user || account;
  }

  private async findLegacyUserByLogin(gameLogin: string) {
    const result = await this.getGamePool().query<LegacyUserRow>(
      `
        SELECT mid,
               idnum,
               password,
               pwd
        FROM tb_user
        WHERE mid = $1
        LIMIT 1
      `,
      [gameLogin]
    );

    return result.rows[0] ?? null;
  }

  private async findLegacyAccountByUsername(gameLogin: string) {
    const result = await this.getAccountPool().query<LegacyAccountRow>(
      `
        SELECT username,
               password
        FROM accounts
        WHERE username = $1
        LIMIT 1
      `,
      [gameLogin]
    );

    return result.rows[0] ?? null;
  }

  private createPool(database: string) {
    if (!isGfDatabaseConfigured()) {
      throw new AppError(503, "SERVICE_UNAVAILABLE", "Nao foi possivel concluir a acao. Tente novamente.");
    }

    const useGfDbSsl = env.GF_DB_SSL === true;

    return new Pool({
      host: env.GF_DB_HOST,
      port: env.GF_DB_PORT,
      user: env.GF_DB_USER,
      password: env.GF_DB_PASSWORD,
      database,
      ssl: useGfDbSsl ? { rejectUnauthorized: true } : false
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

export const gfLegacyAuthService = new GfLegacyAuthService();
