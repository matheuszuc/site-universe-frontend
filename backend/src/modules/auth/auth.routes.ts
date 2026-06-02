import type { FastifyInstance } from "fastify";

import { getMeController } from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.get("/me", getMeController);
}
