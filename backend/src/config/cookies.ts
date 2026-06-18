import { env, isProduction } from "./env.js";

const secondsPerDay = 24 * 60 * 60;

export const sessionCookieName = env.SESSION_COOKIE_NAME;
export const accountMigrationCookieName = env.ACCOUNT_MIGRATION_COOKIE_NAME;

// sameSite="none" exige secure=true (navegadores rejeitam None sem HTTPS).
// Usado quando frontend e backend estao em dominios diferentes (ex: Netlify +
// Railway). Com "lax" mantemos o comportamento anterior: secure so em producao.
function getCookieSameSiteOptions() {
  if (env.COOKIE_SAME_SITE === "none") {
    return { sameSite: "none" as const, secure: true };
  }

  return { sameSite: "lax" as const, secure: isProduction };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    ...getCookieSameSiteOptions(),
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * secondsPerDay
  };
}

export function getClearSessionCookieOptions() {
  return {
    httpOnly: true,
    ...getCookieSameSiteOptions(),
    path: "/"
  };
}

export function getAccountMigrationCookieOptions() {
  return {
    httpOnly: true,
    ...getCookieSameSiteOptions(),
    path: "/",
    maxAge: env.ACCOUNT_MIGRATION_SESSION_TTL_MINUTES * 60
  };
}

export function getClearAccountMigrationCookieOptions() {
  return {
    httpOnly: true,
    ...getCookieSameSiteOptions(),
    path: "/"
  };
}
