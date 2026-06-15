import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { corsOptions } from "./config/cors.js";
import { env, isDevelopment } from "./config/env.js";
import { accountMigrationRoutes } from "./modules/account-migration/account-migration.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { devPaymentsRoutes } from "./modules/dev/dev-payments.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { asaasWebhookRoutes } from "./modules/payments/asaas-webhook.routes.js";
import { rewardsRoutes } from "./modules/rewards/rewards.routes.js";
import { storeRoutes } from "./modules/store/store.routes.js";
import { registerErrorHandler } from "./middlewares/error-handler.js";
import { requestIdMiddleware } from "./middlewares/request-id.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  registerErrorHandler(app);

  await app.register(helmet, {
    contentSecurityPolicy: false,
    frameguard: {
      action: "deny"
    },
    referrerPolicy: {
      policy: "no-referrer"
    }
  });
  await app.register(cors, corsOptions);
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_GLOBAL_MAX,
    timeWindow: env.RATE_LIMIT_GLOBAL_WINDOW
  });
  await app.register(requestIdMiddleware);

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  await app.register(accountMigrationRoutes, {
    prefix: "/api/account-migration"
  });
  await app.register(authRoutes, {
    prefix: "/auth"
  });
  await app.register(adminRoutes, {
    prefix: "/admin"
  });
  await app.register(dashboardRoutes, {
    prefix: "/users"
  });
  await app.register(storeRoutes, {
    prefix: "/api/store"
  });
  await app.register(rewardsRoutes, {
    prefix: "/api/rewards"
  });
  await app.register(ordersRoutes, {
    prefix: "/orders"
  });
  await app.register(asaasWebhookRoutes, {
    prefix: "/webhooks"
  });
  if (isDevelopment) {
    await app.register(devPaymentsRoutes, {
      prefix: "/dev/payments"
    });
  }

  return app;
}
