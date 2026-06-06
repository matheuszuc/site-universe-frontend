import type { FastifyCorsOptions } from "@fastify/cors";

import { env, isDevelopment } from "./env.js";

const developmentOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function getOrigin(value: string) {
  return new URL(value).origin;
}

function getAllowedOrigins() {
  const origins = new Set<string>();

  origins.add(getOrigin(env.FRONTEND_URL));

  if (isDevelopment) {
    for (const origin of developmentOrigins) {
      origins.add(origin);
    }
  }

  return origins;
}

function isAllowedOrigin(origin: string) {
  try {
    return getAllowedOrigins().has(getOrigin(origin));
  } catch {
    return false;
  }
}

export const corsOptions: FastifyCorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  }
};
