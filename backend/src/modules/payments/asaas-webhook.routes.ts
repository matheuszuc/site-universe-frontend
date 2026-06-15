import type { FastifyInstance } from "fastify";

import { asaasWebhookController } from "./asaas-webhook.controller.js";

export async function asaasWebhookRoutes(app: FastifyInstance) {
  // No CSRF/Origin checks: this is a server-to-server callback from Asaas. It is
  // authenticated by the `asaas-access-token` header and re-queried server-to-server.
  app.post("/asaas", asaasWebhookController);
}
