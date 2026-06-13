import type { FastifyInstance } from "fastify";

import { openPixWebhookController } from "./openpix-webhook.controller.js";

export async function openPixWebhookRoutes(app: FastifyInstance) {
  // Capture the raw body (scoped to this plugin) so the optional HMAC signature can
  // be verified byte-for-byte. The webhook does not require CSRF/Origin checks.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, body, done) => {
      const rawBody = typeof body === "string" ? body : body.toString();
      (request as { rawBody?: string }).rawBody = rawBody;

      try {
        done(null, rawBody.length > 0 ? JSON.parse(rawBody) : {});
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  );

  app.post("/openpix", openPixWebhookController);
}
