import { sessionCookieName } from "../../config/cookies.js";
import { AppError } from "../../utils/safe-error.js";
import { authCookieSchema } from "../auth/auth.schemas.js";
import { securityEventsService } from "../security/security-events.service.js";
import { sessionsService } from "../sessions/sessions.service.js";
import { dashboardRepository, type SafeActivityType } from "./dashboard.repository.js";

type RequestInfo = {
  ip?: string;
  userAgent?: string;
};

type DashboardUser = NonNullable<
  Awaited<ReturnType<typeof dashboardRepository.findSafeUserById>>
>;

const activityLabels: Record<SafeActivityType, string> = {
  ACCOUNT_CREATED: "Conta criada",
  EMAIL_VERIFIED: "E-mail verificado",
  PASSWORD_RESET_SUCCESS: "Senha redefinida",
  REGISTER_CREATED: "Conta criada"
};

function isBlockedUserStatus(status: string) {
  return status === "suspended" || status === "deleted";
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "Conta ativa";
  }

  if (status === "pending_verification") {
    return "Aguardando verificação";
  }

  return "Conta com restrição";
}

function toDashboardUser(user: DashboardUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

function buildFallbackActivity(user: DashboardUser) {
  return [
    {
      type: "ACCOUNT_CREATED",
      label: "Conta criada",
      createdAt: user.createdAt
    }
  ];
}

export class DashboardService {
  async getCurrentUserDashboard(
    cookies: Record<string, string | undefined>,
    requestInfo: RequestInfo = {}
  ) {
    const parsedCookie = authCookieSchema.safeParse({
      sessionToken: cookies[sessionCookieName]
    });

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

    const [user, safeActivity] = await Promise.all([
      dashboardRepository.findSafeUserById(session.user.id),
      dashboardRepository.findSafeActivityByUserId(session.user.id)
    ]);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    await sessionsService.touch(session.id);

    const activity = safeActivity.length
      ? safeActivity.map((event) => ({
          type:
            event.eventType === "REGISTER_CREATED"
              ? "ACCOUNT_CREATED"
              : event.eventType,
          label: activityLabels[event.eventType as SafeActivityType],
          createdAt: event.createdAt
        }))
      : buildFallbackActivity(user);

    return {
      user: toDashboardUser(user),
      account: {
        createdAt: user.createdAt,
        statusLabel: getStatusLabel(user.status),
        emailStatusLabel: user.emailVerifiedAt ? "Verificado" : "Não verificado"
      },
      features: {
        shopEnabled: true,
        rewardsEnabled: true,
        gameIntegrationEnabled: false,
        paymentsEnabled: false
      },
      activity
    };
  }
}

export const dashboardService = new DashboardService();
