import { env, isProduction } from "./env.js";

const secondsPerDay = 24 * 60 * 60;

export const sessionCookieName = env.SESSION_COOKIE_NAME;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * secondsPerDay
  };
}

export function getClearSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/"
  };
}
