import type { User } from "@prisma/client";

import { env } from "../../config/env.js";
import { getSessionCookieOptions } from "../../config/cookies.js";
import { prisma } from "../../database/prisma.js";
import { normalizeEmail } from "../../utils/normalize-email.js";
import { emailService } from "../email/email.service.js";
import { sessionsService } from "../sessions/sessions.service.js";
import { csrfService } from "../security/csrf.service.js";
import { passwordService } from "../security/password.service.js";
import { securityEventsService } from "../security/security-events.service.js";
import { tokenService } from "../security/token.service.js";
import { usersService } from "../users/users.service.js";
import { usersRepository } from "../users/users.repository.js";
import { AppError } from "../../utils/safe-error.js";
import {
  authCookieSchema,
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailQuerySchema,
  type AuthenticatedUser,
  type EmailOnlyInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailQuery
} from "./auth.schemas.js";

type RequestInfo = {
  ip?: string;
  userAgent?: string;
};

type LoginResult = {
  user: AuthenticatedUser;
  sessionToken: string;
  cookieOptions: ReturnType<typeof getSessionCookieOptions>;
};

type SuccessResponse = {
  success: true;
  message: string;
};

const invalidCredentialsError = new AppError(
  401,
  "INVALID_CREDENTIALS",
  "E-mail ou senha inválidos."
);

const invalidOrExpiredTokenError = new AppError(
  400,
  "INVALID_OR_EXPIRED_TOKEN",
  "Token inválido ou expirado."
);

const emailVerificationGenericResponse: SuccessResponse = {
  success: true,
  message: "Se a conta existir e precisar de verificação, enviaremos as instruções."
};

const forgotPasswordGenericResponse: SuccessResponse = {
  success: true,
  message: "Se este e-mail existir, enviaremos instruções para redefinir sua senha."
};

function getSafeUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt)
  };
}

function isBlockedUserStatus(status: string) {
  return status === "suspended" || status === "deleted";
}

function isAccountLocked(user: User) {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}

function getNextLockedUntil(failedLoginCount: number) {
  if (failedLoginCount < env.LOGIN_ACCOUNT_LOCK_MAX_FAILURES) {
    return null;
  }

  return new Date(Date.now() + env.LOGIN_ACCOUNT_LOCK_MINUTES * 60 * 1000);
}

function buildFrontendLink(path: string, token: string) {
  const url = new URL(path, env.FRONTEND_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export class AuthService {
  async register(input: unknown, requestInfo: RequestInfo): Promise<AuthenticatedUser> {
    const parsedInput = registerSchema.parse(input) satisfies RegisterInput;
    const emailNormalized = normalizeEmail(parsedInput.email);
    const existingUser = await usersRepository.findByNormalizedEmail(emailNormalized);

    if (existingUser) {
      throw new AppError(409, "CONFLICT", "Não foi possível criar a conta.");
    }

    const passwordHash = await passwordService.hashPassword(parsedInput.password);
    const user = await usersRepository.create({
      name: parsedInput.name,
      email: emailNormalized,
      emailNormalized,
      passwordHash,
      role: "user",
      status: "pending_verification",
      emailVerifiedAt: null
    });

    await securityEventsService.record({
      userId: user.id,
      eventType: "REGISTER_CREATED",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent
    });

    await this.requestEmailVerificationForUser(user, requestInfo);

    return getSafeUser(user);
  }

  async resendVerification(input: unknown, requestInfo: RequestInfo): Promise<SuccessResponse> {
    const parsedInput = emailOnlySchema.parse(input) satisfies EmailOnlyInput;
    const emailNormalized = normalizeEmail(parsedInput.email);
    const user = await usersService.findByEmail(emailNormalized);

    if (user && !user.emailVerifiedAt && !isBlockedUserStatus(user.status)) {
      await this.requestEmailVerificationForUser(user, requestInfo);
    }

    return emailVerificationGenericResponse;
  }

  async verifyEmail(input: unknown, requestInfo: RequestInfo): Promise<SuccessResponse> {
    const parsedInput = verifyEmailQuerySchema.safeParse(input);

    if (!parsedInput.success) {
      await securityEventsService.record({
        eventType: "EMAIL_VERIFY_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
      throw invalidOrExpiredTokenError;
    }

    const parsedToken = parsedInput.data satisfies VerifyEmailQuery;
    const tokenHash = tokenService.hashToken(parsedToken.token);
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: true
      }
    });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt <= new Date() ||
      isBlockedUserStatus(verificationToken.user.status)
    ) {
      await securityEventsService.record({
        userId: verificationToken?.userId ?? null,
        eventType: "EMAIL_VERIFY_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
      throw invalidOrExpiredTokenError;
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: now }
      }),
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerifiedAt: now,
          status:
            verificationToken.user.status === "pending_verification"
              ? "active"
              : verificationToken.user.status
        }
      })
    ]);

    await securityEventsService.record({
      userId: verificationToken.userId,
      eventType: "EMAIL_VERIFIED",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent
    });

    return {
      success: true,
      message: "E-mail verificado com sucesso."
    };
  }

  async forgotPassword(input: unknown, requestInfo: RequestInfo): Promise<SuccessResponse> {
    const parsedInput = emailOnlySchema.parse(input) satisfies EmailOnlyInput;
    const emailNormalized = normalizeEmail(parsedInput.email);
    const user = await usersService.findByEmail(emailNormalized);

    if (user && !isBlockedUserStatus(user.status)) {
      const resetToken = await this.createPasswordResetToken(user.id, requestInfo);
      const resetLink = buildFrontendLink("/reset-password", resetToken);

      await emailService.sendPasswordResetEmail(user.email, resetLink);
      await securityEventsService.record({
        userId: user.id,
        eventType: "PASSWORD_RESET_REQUESTED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
    }

    return forgotPasswordGenericResponse;
  }

  async resetPassword(input: unknown, requestInfo: RequestInfo): Promise<SuccessResponse> {
    const parsedInput = resetPasswordSchema.parse(input) satisfies ResetPasswordInput;
    const tokenHash = tokenService.hashToken(parsedInput.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: true
      }
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date() ||
      isBlockedUserStatus(resetToken.user.status)
    ) {
      await securityEventsService.record({
        userId: resetToken?.userId ?? null,
        eventType: "PASSWORD_RESET_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
      throw invalidOrExpiredTokenError;
    }

    const now = new Date();
    const passwordHash = await passwordService.hashPassword(parsedInput.password);
    const transactionResult = await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now }
      }),
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null
        }
      }),
      prisma.session.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null
        },
        data: {
          revokedAt: now,
          revokedReason: "password_reset"
        }
      })
    ]);

    await securityEventsService.record({
      userId: resetToken.userId,
      eventType: "PASSWORD_RESET_SUCCESS",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent
    });
    await securityEventsService.record({
      userId: resetToken.userId,
      eventType: "SESSIONS_REVOKED_PASSWORD_RESET",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      metadata: {
        count: transactionResult[2].count
      }
    });

    return {
      success: true,
      message: "Senha redefinida com sucesso."
    };
  }

  async login(input: unknown, requestInfo: RequestInfo): Promise<LoginResult> {
    const parsedInput = loginSchema.parse(input) satisfies LoginInput;
    const emailNormalized = normalizeEmail(parsedInput.email);
    const user = await usersService.findByEmail(emailNormalized);

    if (!user) {
      await securityEventsService.record({
        eventType: "LOGIN_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: "invalid_credentials"
        }
      });
      throw invalidCredentialsError;
    }

    if (isAccountLocked(user)) {
      await securityEventsService.record({
        userId: user.id,
        eventType: "LOGIN_BLOCKED_ACCOUNT_LOCKED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
      throw invalidCredentialsError;
    }

    const passwordMatches = await passwordService.verifyPassword(
      user.passwordHash,
      parsedInput.password
    );

    if (!passwordMatches) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lockedUntil = getNextLockedUntil(failedLoginCount);

      await usersService.markLoginFailed(user.id, failedLoginCount, lockedUntil);
      await securityEventsService.record({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: "invalid_credentials",
          locked: Boolean(lockedUntil)
        }
      });

      if (lockedUntil) {
        await securityEventsService.record({
          userId: user.id,
          eventType: "LOGIN_BLOCKED_ACCOUNT_LOCKED",
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent
        });
      }

      throw invalidCredentialsError;
    }

    if (isBlockedUserStatus(user.status)) {
      await securityEventsService.record({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: "blocked_status"
        }
      });
      throw invalidCredentialsError;
    }

    const session = await sessionsService.createSession(user.id, requestInfo);
    const updatedUser = await usersService.markLoginSuccess(user.id);

    await securityEventsService.record({
      userId: user.id,
      eventType: "LOGIN_SUCCESS",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent
    });

    return {
      user: getSafeUser(updatedUser),
      sessionToken: session.sessionToken,
      cookieOptions: getSessionCookieOptions()
    };
  }

  async logout(
    sessionToken: string | undefined,
    csrfToken: string | undefined,
    requestInfo: RequestInfo
  ) {
    const parsedCookie = authCookieSchema.safeParse({ sessionToken });

    if (!parsedCookie.success) {
      return;
    }

    const session = await sessionsService.findValidSession(parsedCookie.data.sessionToken);

    if (!session) {
      return;
    }

    if (!csrfService.verifyToken(csrfToken, session.csrfTokenHash)) {
      await securityEventsService.record({
        userId: session.user.id,
        eventType: "CSRF_FAILED",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
      throw new AppError(403, "CSRF_FAILED", "Requisição não autorizada.");
    }

    await sessionsService.revokeSession(parsedCookie.data.sessionToken, "logout");

    if (session) {
      await securityEventsService.record({
        userId: session.user.id,
        eventType: "LOGOUT",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent
      });
    }
  }

  async issueCsrfToken(
    sessionToken: string | undefined,
    requestInfo: RequestInfo = {}
  ): Promise<string> {
    const parsedCookie = authCookieSchema.safeParse({ sessionToken });

    if (!parsedCookie.success) {
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    const session = await sessionsService.findValidSession(parsedCookie.data.sessionToken);

    if (!session || isBlockedUserStatus(session.user.status)) {
      await securityEventsService.record({
        userId: session?.user.id ?? null,
        eventType: "INVALID_SESSION",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: session ? "blocked_status" : "session_not_found"
        }
      });
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    const csrfToken = csrfService.generateToken();
    await sessionsService.setCsrfTokenHash(session.id, csrfService.hashToken(csrfToken));
    await sessionsService.touch(session.id);

    return csrfToken;
  }

  async getCurrentUser(
    sessionToken: string | undefined,
    requestInfo: RequestInfo = {}
  ): Promise<AuthenticatedUser> {
    const parsedCookie = authCookieSchema.safeParse({ sessionToken });

    if (!parsedCookie.success) {
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    const session = await sessionsService.findValidSession(parsedCookie.data.sessionToken);

    if (!session) {
      await securityEventsService.record({
        eventType: "INVALID_SESSION",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: "session_not_found"
        }
      });
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    if (isBlockedUserStatus(session.user.status)) {
      await securityEventsService.record({
        userId: session.user.id,
        eventType: "INVALID_SESSION",
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        metadata: {
          reason: "blocked_status"
        }
      });
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    await sessionsService.touch(session.id);

    return getSafeUser(session.user);
  }

  private async requestEmailVerificationForUser(user: User, requestInfo: RequestInfo) {
    const verificationToken = await this.createEmailVerificationToken(user.id);
    const verificationLink = buildFrontendLink("/verify-email", verificationToken);

    await emailService.sendVerificationEmail(user.email, verificationLink);
    await securityEventsService.record({
      userId: user.id,
      eventType: "EMAIL_VERIFY_REQUESTED",
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent
    });
  }

  private async createEmailVerificationToken(userId: string) {
    const now = new Date();
    const token = tokenService.generateSecureToken();
    const tokenHash = tokenService.hashToken(token);

    await prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      }),
      prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt: addHours(now, env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS)
        }
      })
    ]);

    return token;
  }

  private async createPasswordResetToken(userId: string, requestInfo: RequestInfo) {
    const now = new Date();
    const token = tokenService.generateSecureToken();
    const tokenHash = tokenService.hashToken(token);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      }),
      prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          requestedIpHash: tokenService.hashOptionalValue(requestInfo.ip),
          expiresAt: addMinutes(now, env.PASSWORD_RESET_TOKEN_TTL_MINUTES)
        }
      })
    ]);

    return token;
  }
}

export const authService = new AuthService();
