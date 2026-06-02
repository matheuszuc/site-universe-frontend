import type { User } from "@prisma/client";

import { env } from "../../config/env.js";
import { getSessionCookieOptions } from "../../config/cookies.js";
import { normalizeEmail } from "../../utils/normalize-email.js";
import { sessionsService } from "../sessions/sessions.service.js";
import { csrfService } from "../security/csrf.service.js";
import { passwordService } from "../security/password.service.js";
import { securityEventsService } from "../security/security-events.service.js";
import { usersService } from "../users/users.service.js";
import { usersRepository } from "../users/users.repository.js";
import { AppError } from "../../utils/safe-error.js";
import {
  authCookieSchema,
  loginSchema,
  registerSchema,
  type AuthenticatedUser,
  type LoginInput,
  type RegisterInput
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

const invalidCredentialsError = new AppError(
  401,
  "INVALID_CREDENTIALS",
  "E-mail ou senha inválidos."
);

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

    return getSafeUser(user);
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
}

export const authService = new AuthService();
