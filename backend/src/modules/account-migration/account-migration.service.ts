import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { normalizeEmail } from "../../utils/normalize-email.js";
import { AppError } from "../../utils/safe-error.js";
import { emailService } from "../email/email.service.js";
import { passwordService } from "../security/password.service.js";
import { tokenService } from "../security/token.service.js";
import {
  completeAccountMigrationSchema,
  startAccountMigrationSchema,
  type CompleteAccountMigrationInput,
  type StartAccountMigrationInput
} from "./account-migration.schemas.js";
import { gfLegacyAuthService, type VerifiedLegacyGameAccount } from "./gf-legacy-auth.service.js";

type RequestInfo = {
  ip?: string;
  userAgent?: string;
};

type GameAccountIdentity = Pick<VerifiedLegacyGameAccount, "gameLogin" | "gameAccountId">;

const invalidLegacyCredentialsError = new AppError(
  401,
  "INVALID_CREDENTIALS",
  "Usuario ou senha invalidos."
);

const accountAlreadyMigratedError = new AppError(
  409,
  "ACCOUNT_ALREADY_MIGRATED",
  "Esta conta ja foi atualizada. Use o login normal do site ou a recuperacao de senha."
);

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildFrontendLink(path: string, token: string) {
  const url = new URL(path, env.FRONTEND_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

function normalizeGameLogin(gameLogin: string) {
  return gameLogin.trim();
}

function safeDisplayGameLogin(gameLogin: string) {
  return gameLogin.trim();
}

function getRequestHashes(requestInfo: RequestInfo) {
  return {
    ipHash: tokenService.hashOptionalValue(requestInfo.ip),
    userAgentHash: tokenService.hashOptionalValue(requestInfo.userAgent)
  };
}

function buildGameAccountLookup(account: GameAccountIdentity) {
  return [
    {
      gameLogin: account.gameLogin
    },
    {
      gameAccountId: account.gameAccountId
    }
  ];
}

export class AccountMigrationService {
  async start(input: unknown, requestInfo: RequestInfo = {}) {
    const parsedInput = startAccountMigrationSchema.parse(
      input
    ) satisfies StartAccountMigrationInput;
    const gameLogin = normalizeGameLogin(parsedInput.gameLogin);

    if (await this.findMigratedGameAccountByLogin(gameLogin)) {
      await this.recordAudit({
        eventType: "ACCOUNT_MIGRATION_START_REJECTED_ALREADY_MIGRATED",
        success: false,
        reason: "already_migrated",
        gameLogin,
        requestInfo
      });
      throw accountAlreadyMigratedError;
    }

    const verifiedAccount = await gfLegacyAuthService.verifyCredentials({
      gameLogin,
      currentPassword: parsedInput.currentPassword
    });

    if (!verifiedAccount) {
      await this.recordAudit({
        eventType: "ACCOUNT_MIGRATION_START_FAILED",
        success: false,
        reason: "invalid_credentials",
        gameLogin,
        requestInfo
      });
      throw invalidLegacyCredentialsError;
    }

    if (await this.findMigratedGameAccount(verifiedAccount)) {
      await this.recordAudit({
        eventType: "ACCOUNT_MIGRATION_START_REJECTED_ALREADY_MIGRATED",
        success: false,
        reason: "already_migrated",
        gameLogin: verifiedAccount.gameLogin,
        requestInfo
      });
      throw accountAlreadyMigratedError;
    }

    const now = new Date();
    const migrationToken = tokenService.generateSecureToken();
    const { ipHash, userAgentHash } = getRequestHashes(requestInfo);
    const session = await prisma.legacyAccountMigrationSession.create({
      data: {
        sessionTokenHash: tokenService.hashToken(migrationToken),
        gameLogin: normalizeGameLogin(verifiedAccount.gameLogin),
        gameAccountId: verifiedAccount.gameAccountId,
        status: "verified",
        expiresAt: addMinutes(now, env.ACCOUNT_MIGRATION_SESSION_TTL_MINUTES),
        attempts: 1,
        ipHash,
        userAgentHash
      }
    });

    await this.recordAudit({
      eventType: "ACCOUNT_MIGRATION_START_VERIFIED",
      success: true,
      reason: "legacy_credentials_verified",
      gameLogin,
      requestInfo,
      metadata: {
        sessionId: session.id,
        matchedPasswordSources: verifiedAccount.matchedPasswordSources,
        passwordHashState: verifiedAccount.passwordHashState
      }
    });

    return {
      migrationToken,
      body: {
        success: true,
        gameLogin: safeDisplayGameLogin(verifiedAccount.gameLogin),
        expiresAt: session.expiresAt.toISOString()
      }
    };
  }

  async status(migrationToken: string | undefined) {
    const session = await this.findValidSession(migrationToken);

    if (!session) {
      return {
        status: "none" as const
      };
    }

    return {
      status: "verified" as const,
      gameLogin: safeDisplayGameLogin(session.gameLogin),
      expiresAt: session.expiresAt.toISOString()
    };
  }

  async complete(
    input: unknown,
    migrationToken: string | undefined,
    requestInfo: RequestInfo = {}
  ) {
    const parsedInput = completeAccountMigrationSchema.parse(
      input
    ) satisfies CompleteAccountMigrationInput;
    const session = await this.findValidSession(migrationToken);

    if (!session) {
      await this.recordAudit({
        eventType: "ACCOUNT_MIGRATION_COMPLETE_REJECTED",
        success: false,
        reason: "missing_expired_or_completed_session",
        requestInfo
      });
      throw new AppError(401, "UNAUTHORIZED", "Sessao de migracao expirada.");
    }

    const now = new Date();
    const emailNormalized = normalizeEmail(parsedInput.email);
    const passwordHash = await passwordService.hashPassword(parsedInput.newPassword);

    const result = await prisma.$transaction(async (tx) => {
      const sessionClaim = await tx.legacyAccountMigrationSession.updateMany({
        where: {
          id: session.id,
          status: "verified",
          expiresAt: {
            gt: now
          }
        },
        data: {
          status: "completed",
          completedAt: now
        }
      });

      if (sessionClaim.count !== 1) {
        await this.recordAuditTx(tx, {
          eventType: "ACCOUNT_MIGRATION_COMPLETE_REJECTED",
          success: false,
          reason: "session_already_used",
          gameLogin: session.gameLogin,
          requestInfo
        });
        throw new AppError(409, "CONFLICT", "Nao foi possivel atualizar a conta com estes dados.");
      }

      const existingUser = await tx.user.findUnique({
        where: {
          emailNormalized
        }
      });

      if (existingUser) {
        await this.recordAuditTx(tx, {
          eventType: "ACCOUNT_MIGRATION_COMPLETE_REJECTED",
          success: false,
          reason: "email_already_exists",
          gameLogin: session.gameLogin,
          requestInfo
        });
        throw new AppError(409, "CONFLICT", "Nao foi possivel atualizar a conta com estes dados.");
      }

      const gameAccountId = session.gameAccountId;

      if (!gameAccountId) {
        await this.recordAuditTx(tx, {
          eventType: "ACCOUNT_MIGRATION_COMPLETE_REJECTED",
          success: false,
          reason: "missing_game_account_id",
          gameLogin: session.gameLogin,
          requestInfo
        });
        throw new AppError(409, "CONFLICT", "Nao foi possivel atualizar a conta com estes dados.");
      }

      const accountForLookup = {
        gameLogin: session.gameLogin,
        gameAccountId
      };

      if (await this.findMigratedGameAccountTx(tx, accountForLookup)) {
        await this.recordAuditTx(tx, {
          eventType: "ACCOUNT_MIGRATION_COMPLETE_REJECTED",
          success: false,
          reason: "game_account_already_migrated",
          gameLogin: session.gameLogin,
          requestInfo
        });
        throw accountAlreadyMigratedError;
      }

      await gfLegacyAuthService.updateLegacyPassword({
        gameLogin: session.gameLogin,
        gameAccountId,
        newPassword: parsedInput.newPassword
      });

      const user = await tx.user.create({
        data: {
          name: safeDisplayGameLogin(session.gameLogin),
          email: emailNormalized,
          emailNormalized,
          passwordHash,
          role: "user",
          status: "pending_verification",
          emailVerifiedAt: null
        }
      });
      const gameAccount = await tx.gameAccount.create({
        data: {
          userId: user.id,
          gameLogin: session.gameLogin,
          gameAccountId,
          status: "migrated",
          linkedAt: now,
          verifiedAt: now,
          migratedAt: now,
          requiresEmailVerification: true,
          requiresPasswordUpdate: false
        }
      });
      const verificationToken = tokenService.generateSecureToken();
      const verificationTokenHash = tokenService.hashToken(verificationToken);

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: verificationTokenHash,
          expiresAt: addHours(now, env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS)
        }
      });
      await tx.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "ACCOUNT_MIGRATION_COMPLETED",
          ipHash: tokenService.hashOptionalValue(requestInfo.ip),
          userAgent: tokenService.hashOptionalValue(requestInfo.userAgent),
          metadata: {
            gameAccountId: gameAccount.id,
            gamePasswordUpdateStatus: "updated"
          } satisfies Prisma.InputJsonValue
        }
      });
      await this.recordAuditTx(tx, {
        eventType: "ACCOUNT_MIGRATION_COMPLETED",
        success: true,
        reason: "updated",
        gameLogin: session.gameLogin,
        userId: user.id,
        requestInfo,
        metadata: {
          gameAccountId: gameAccount.id,
          requiresPasswordUpdate: false
        }
      });

      return {
        user,
        verificationToken
      };
    });

    const verificationLink = buildFrontendLink("/verify-email", result.verificationToken);
    await emailService.sendVerificationEmail(emailNormalized, verificationLink);

    return {
      success: true,
      status: "email_verification_required" as const,
      message: "Enviamos um link de verificacao para seu e-mail.",
      gameLogin: safeDisplayGameLogin(session.gameLogin),
      requiresPasswordUpdate: false
    };
  }

  private async findValidSession(migrationToken: string | undefined) {
    if (!migrationToken) {
      return null;
    }

    const session = await prisma.legacyAccountMigrationSession.findUnique({
      where: {
        sessionTokenHash: tokenService.hashToken(migrationToken)
      }
    });

    if (!session || session.status !== "verified") {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      await prisma.legacyAccountMigrationSession.update({
        where: {
          id: session.id
        },
        data: {
          status: "expired"
        }
      });
      return null;
    }

    return session;
  }

  private findMigratedGameAccountByLogin(gameLogin: string) {
    return prisma.gameAccount.findFirst({
      where: {
        gameLogin,
        OR: [
          {
            status: {
              in: ["linked", "migrated", "completed"]
            }
          },
          {
            migratedAt: {
              not: null
            }
          }
        ]
      }
    });
  }

  private findMigratedGameAccount(account: VerifiedLegacyGameAccount) {
    return this.findMigratedGameAccountTx(prisma, account);
  }

  private findMigratedGameAccountTx(client: Prisma.TransactionClient | typeof prisma, account: GameAccountIdentity) {
    return client.gameAccount.findFirst({
      where: {
        OR: buildGameAccountLookup(account),
        AND: [
          {
            OR: [
              {
                status: {
                  in: ["linked", "migrated", "completed"]
                }
              },
              {
                migratedAt: {
                  not: null
                }
              }
            ]
          }
        ]
      }
    });
  }

  private recordAudit(input: {
    eventType: string;
    success: boolean;
    reason?: string | null;
    gameLogin?: string | null;
    userId?: string | null;
    requestInfo?: RequestInfo;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.recordAuditTx(prisma, input);
  }

  private recordAuditTx(
    client: Prisma.TransactionClient | typeof prisma,
    input: {
      eventType: string;
      success: boolean;
      reason?: string | null;
      gameLogin?: string | null;
      userId?: string | null;
      requestInfo?: RequestInfo;
      metadata?: Prisma.InputJsonValue;
    }
  ) {
    return client.accountMigrationAuditLog.create({
      data: {
        eventType: input.eventType,
        success: input.success,
        reason: input.reason ?? null,
        gameLogin: input.gameLogin ?? null,
        userId: input.userId ?? null,
        ipHash: tokenService.hashOptionalValue(input.requestInfo?.ip),
        userAgent: tokenService.hashOptionalValue(input.requestInfo?.userAgent),
        metadata: input.metadata
      }
    });
  }
}

export const accountMigrationService = new AccountMigrationService();
