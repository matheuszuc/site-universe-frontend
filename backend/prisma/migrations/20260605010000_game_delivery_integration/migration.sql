ALTER TABLE "reward_tiers"
  ADD COLUMN "box_game_item_id" INTEGER;

UPDATE "reward_tiers"
SET "required_up_total" = data."required_up_total",
    "updated_at" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('rank_1', 3000),
    ('rank_2', 7000),
    ('rank_3', 12000),
    ('rank_4', 18000),
    ('rank_5', 24000),
    ('rank_6', 30000)
) AS data("code", "required_up_total")
WHERE "reward_tiers"."code" = data."code";

CREATE TABLE "game_deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "idempotency_key" TEXT NOT NULL,
  "order_id" UUID,
  "payment_id" UUID,
  "reward_delivery_id" UUID,
  "reward_tier_claim_id" UUID,
  "reward_tier_code" TEXT,
  "gf_account_name" TEXT,
  "ap_amount" INTEGER,
  "item_id" INTEGER,
  "item_quantity" INTEGER,
  "point" INTEGER DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "delivered_at" TIMESTAMP(3),
  "locked_at" TIMESTAMP(3),

  CONSTRAINT "game_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "game_deliveries_type_check" CHECK ("type" IN ('CREDIT_AP', 'REWARD_BOX')),
  CONSTRAINT "game_deliveries_status_check" CHECK ("status" IN ('pending', 'processing', 'delivered', 'failed', 'skipped')),
  CONSTRAINT "game_deliveries_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "game_deliveries_max_attempts_check" CHECK ("max_attempts" > 0),
  CONSTRAINT "game_deliveries_ap_amount_check" CHECK ("ap_amount" IS NULL OR "ap_amount" > 0),
  CONSTRAINT "game_deliveries_item_quantity_check" CHECK ("item_quantity" IS NULL OR "item_quantity" > 0),
  CONSTRAINT "game_deliveries_point_check" CHECK ("point" IS NULL OR "point" >= 0)
);

CREATE UNIQUE INDEX "game_deliveries_idempotency_key_key"
  ON "game_deliveries"("idempotency_key");

CREATE INDEX "game_deliveries_user_created_idx"
  ON "game_deliveries"("user_id", "created_at" DESC);

CREATE INDEX "game_deliveries_status_created_idx"
  ON "game_deliveries"("status", "created_at");

CREATE INDEX "game_deliveries_type_status_idx"
  ON "game_deliveries"("type", "status");

CREATE INDEX "game_deliveries_order_id_idx"
  ON "game_deliveries"("order_id");

CREATE INDEX "game_deliveries_payment_id_idx"
  ON "game_deliveries"("payment_id");

CREATE INDEX "game_deliveries_reward_delivery_id_idx"
  ON "game_deliveries"("reward_delivery_id");

CREATE UNIQUE INDEX "game_deliveries_reward_tier_claim_id_key"
  ON "game_deliveries"("reward_tier_claim_id")
  WHERE "reward_tier_claim_id" IS NOT NULL;

CREATE INDEX "game_deliveries_reward_tier_claim_id_idx"
  ON "game_deliveries"("reward_tier_claim_id");

CREATE INDEX "game_deliveries_reward_tier_code_idx"
  ON "game_deliveries"("reward_tier_code");

ALTER TABLE "game_deliveries"
  ADD CONSTRAINT "game_deliveries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_deliveries"
  ADD CONSTRAINT "game_deliveries_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_deliveries"
  ADD CONSTRAINT "game_deliveries_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_deliveries"
  ADD CONSTRAINT "game_deliveries_reward_delivery_id_fkey"
  FOREIGN KEY ("reward_delivery_id") REFERENCES "reward_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "game_deliveries"
  ADD CONSTRAINT "game_deliveries_reward_tier_claim_id_fkey"
  FOREIGN KEY ("reward_tier_claim_id") REFERENCES "user_reward_tier_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
