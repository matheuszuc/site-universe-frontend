import { sessionsService } from "../sessions/sessions.service.js";
import { AppError } from "../../utils/safe-error.js";
import { authCookieSchema, type AuthenticatedUser } from "./auth.schemas.js";

export class AuthService {
  async getCurrentUser(sessionToken: string | undefined): Promise<AuthenticatedUser> {
    const parsedCookie = authCookieSchema.safeParse({ sessionToken });

    if (!parsedCookie.success) {
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    const session = await sessionsService.findValidSession(parsedCookie.data.sessionToken);

    if (!session) {
      throw new AppError(401, "UNAUTHORIZED", "Não autorizado.");
    }

    await sessionsService.touch(session.id);

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      status: session.user.status,
      emailVerifiedAt: session.user.emailVerifiedAt
    };
  }
}

export const authService = new AuthService();
