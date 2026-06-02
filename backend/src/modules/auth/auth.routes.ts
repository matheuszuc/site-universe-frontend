import type { FastifyInstance } from "fastify";

import {
  getMeController,
  loginController,
  logoutController,
  registerController
} from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", registerController);
  app.post("/login", loginController);
  app.post("/logout", logoutController);
  app.get("/me", getMeController);
}
