-- CreateTable
CREATE TABLE "ranking_monthly_snapshots" (
    "id" UUID NOT NULL,
    "player_name" TEXT NOT NULL,
    "player_class" INTEGER NOT NULL,
    "win_count" INTEGER NOT NULL,
    "lose_count" INTEGER NOT NULL,
    "mvp_count" INTEGER NOT NULL,
    "snapshot_month" INTEGER NOT NULL,
    "snapshot_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_monthly_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_monthly_champions" (
    "id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "player_name" TEXT NOT NULL,
    "player_class" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "win_count" INTEGER NOT NULL,
    "lose_count" INTEGER NOT NULL,
    "mvp_count" INTEGER NOT NULL,
    "champion_month" INTEGER NOT NULL,
    "champion_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_monthly_champions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ranking_monthly_snapshots_snapshot_month_snapshot_year_idx" ON "ranking_monthly_snapshots"("snapshot_month", "snapshot_year");

-- CreateIndex
CREATE INDEX "ranking_monthly_champions_champion_month_champion_year_idx" ON "ranking_monthly_champions"("champion_month", "champion_year");
