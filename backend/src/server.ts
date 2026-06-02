import { env } from "./config/env.js";
import { buildApp } from "./app.js";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
}

void start();
