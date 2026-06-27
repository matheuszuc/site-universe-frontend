-- AlterTable
-- Adiciona join_count ao snapshot mensal (usado no calculo de quits do ranking).
-- DEFAULT 0 preenche linhas existentes; em seguida o default e removido para casar
-- com o schema Prisma (campo obrigatorio, sem default).
ALTER TABLE "ranking_monthly_snapshots" ADD COLUMN "join_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ranking_monthly_snapshots" ALTER COLUMN "join_count" DROP DEFAULT;
