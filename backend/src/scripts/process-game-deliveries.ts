import { prisma } from "../database/prisma.js";
import { gameDeliveryService } from "../modules/game-delivery/game-delivery.service.js";

try {
  const processed = await gameDeliveryService.processPendingDeliveries();

  console.info(`Game deliveries processed: ${processed.length}`);
} catch {
  console.error(
    "Nao foi possivel processar entregas. Verifique DATABASE_URL, migrations e conectividade do banco."
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
