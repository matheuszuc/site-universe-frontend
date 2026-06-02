import type { FastifyCorsOptions } from "@fastify/cors";

import { env } from "./env.js";

export const corsOptions: FastifyCorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || origin === env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"), false);
  }
};
