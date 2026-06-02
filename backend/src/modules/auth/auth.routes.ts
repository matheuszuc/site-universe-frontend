import type { FastifyInstance } from "fastify";

import { requireJsonContentType } from "../../middlewares/content-type.js";
import { requireAllowedOrigin } from "../../middlewares/origin-check.js";
import {
  emailVerificationRateLimit,
  loginRateLimit,
  passwordResetRateLimit,
  registerRateLimit
} from "../security/rate-limit.js";
import {
  csrfController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController
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
  app.post(
    "/resend-verification",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, emailVerificationRateLimit]
    },
    resendVerificationController
  );
  app.get("/verify-email", verifyEmailController);
  app.post(
    "/forgot-password",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, passwordResetRateLimit]
    },
    forgotPasswordController
  );
  app.post(
    "/reset-password",
    {
      preHandler: [requireAllowedOrigin, requireJsonContentType, passwordResetRateLimit]
    },
    resetPasswordController
  );
  app.get("/me", getMeController);
}
