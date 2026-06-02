import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import {
  loginRateLimit,
  registerRateLimit
} from "../security/rate-limit.js";
import {
  csrfController,
  getMeController,
  loginController,
  logoutController,
  registerController
} from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, registerRateLimit]
    },
    registerController
  );
  app.post(
    "/login",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, loginRateLimit]
    },
    loginController
  );
  app.post(
    "/logout",
    {
      preHandler: [requireAllowedOrigin]
    },
    logoutController
  );
  app.get(
    "/csrf",
    {
      preHandler: [requireAllowedOrigin]
    },
    csrfController
  );
  app.get("/me", getMeController);
}
