import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";

import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { registerErrorHandler } from "./middlewares/error-handler.js";
import { requestIdMiddleware } from "./middlewares/request-id.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  registerErrorHandler(app);

  await app.register(helmet);
  await app.register(cors, corsOptions);
  await app.register(cookie);
  await app.register(requestIdMiddleware);

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  await app.register(authRoutes, {
    prefix: "/auth"
  });

  return app;
}
