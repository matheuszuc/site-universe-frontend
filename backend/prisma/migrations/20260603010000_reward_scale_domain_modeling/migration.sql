CREATE TABLE "store_packages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "up_amount" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_packages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "store_packages_up_amount_check" CHECK ("up_amount" > 0),
    CONSTRAINT "store_packages_price_cents_check" CHECK ("price_cents" > 0),
    CONSTRAINT "store_packages_currency_check" CHECK ("currency" IN ('BRL'))
);

CREATE TABLE "reward_tiers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required_up_total" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_tiers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reward_tiers_required_up_total_check" CHECK ("required_up_total" > 0),
    CONSTRAINT "reward_tiers_display_order_check" CHECK ("display_order" > 0)
);

CREATE TABLE "reward_tier_items" (
    "id" UUID NOT NULL,
    "reward_tier_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_description" TEXT,
    "game_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_tier_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reward_tier_items_quantity_check" CHECK ("quantity" > 0)
);

CREATE TABLE "user_reward_cycles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "accumulated_up" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "reset_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reward_cycles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_reward_cycles_cycle_number_check" CHECK ("cycle_number" > 0),
    CONSTRAINT "user_reward_cycles_accumulated_up_check" CHECK ("accumulated_up" >= 0),
    CONSTRAINT "user_reward_cycles_status_check" CHECK ("status" IN ('active', 'completed', 'reset', 'cancelled'))
);

CREATE TABLE "user_reward_cycle_progress_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_reward_cycle_id" UUID NOT NULL,
    "wallet_transaction_id" UUID NOT NULL,
    "payment_id" UUID,
    "order_id" UUID,
    "amount_up" INTEGER NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urc_progress_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "urc_progress_amount_up_check" CHECK ("amount_up" > 0),
    CONSTRAINT "urc_progress_source_type_check" CHECK ("source_type" IN ('payment_purchase', 'manual_future'))
);

CREATE TABLE "user_reward_tier_claims" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_reward_cycle_id" UUID NOT NULL,
    "reward_tier_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "claimed_at" TIMESTAMP(3),
    "delivery_status" TEXT NOT NULL DEFAULT 'pending_game_integration',
    "reward_delivery_id" UUID,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reward_tier_claims_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "urt_claims_status_check" CHECK ("status" IN ('claimed', 'delivery_pending', 'delivered', 'failed', 'cancelled')),
    CONSTRAINT "urt_claims_delivery_status_check" CHECK ("delivery_status" IN ('pending_game_integration', 'pending', 'processing', 'delivered', 'failed', 'cancelled'))
);

CREATE UNIQUE INDEX "store_packages_code_key" ON "store_packages"("code");
CREATE INDEX "store_packages_active_order_idx" ON "store_packages"("is_active", "display_order");
CREATE UNIQUE INDEX "reward_tiers_code_key" ON "reward_tiers"("code");
CREATE UNIQUE INDEX "reward_tiers_display_order_key" ON "reward_tiers"("display_order");
CREATE INDEX "reward_tiers_active_order_idx" ON "reward_tiers"("is_active", "display_order");
CREATE INDEX "reward_tier_items_tier_id_idx" ON "reward_tier_items"("reward_tier_id");
CREATE INDEX "reward_tier_items_tier_order_idx" ON "reward_tier_items"("reward_tier_id", "display_order");
CREATE UNIQUE INDEX "user_reward_cycles_user_cycle_key" ON "user_reward_cycles"("user_id", "cycle_number");
CREATE UNIQUE INDEX "user_reward_cycles_one_active_key" ON "user_reward_cycles"("user_id") WHERE "status" = 'active';
CREATE INDEX "user_reward_cycles_user_status_idx" ON "user_reward_cycles"("user_id", "status");
CREATE INDEX "user_reward_cycles_user_created_idx" ON "user_reward_cycles"("user_id", "created_at" DESC);
CREATE UNIQUE INDEX "urc_progress_wallet_tx_key" ON "user_reward_cycle_progress_events"("wallet_transaction_id");
CREATE UNIQUE INDEX "urc_progress_source_key" ON "user_reward_cycle_progress_events"("source_type", "source_id");
CREATE INDEX "urc_progress_user_created_idx" ON "user_reward_cycle_progress_events"("user_id", "created_at" DESC);
CREATE INDEX "urc_progress_cycle_created_idx" ON "user_reward_cycle_progress_events"("user_reward_cycle_id", "created_at");
CREATE INDEX "urc_progress_payment_id_idx" ON "user_reward_cycle_progress_events"("payment_id");
CREATE INDEX "urc_progress_order_id_idx" ON "user_reward_cycle_progress_events"("order_id");
CREATE UNIQUE INDEX "urt_claims_cycle_tier_key" ON "user_reward_tier_claims"("user_reward_cycle_id", "reward_tier_id");
CREATE UNIQUE INDEX "urt_claims_idempotency_key" ON "user_reward_tier_claims"("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX "urt_claims_user_created_idx" ON "user_reward_tier_claims"("user_id", "created_at" DESC);
CREATE INDEX "urt_claims_cycle_id_idx" ON "user_reward_tier_claims"("user_reward_cycle_id");
CREATE INDEX "urt_claims_tier_id_idx" ON "user_reward_tier_claims"("reward_tier_id");
CREATE INDEX "urt_claims_status_created_idx" ON "user_reward_tier_claims"("status", "created_at");
CREATE INDEX "urt_claims_delivery_created_idx" ON "user_reward_tier_claims"("delivery_status", "created_at");

ALTER TABLE "reward_tier_items" ADD CONSTRAINT "reward_tier_items_tier_id_fkey" FOREIGN KEY ("reward_tier_id") REFERENCES "reward_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycles" ADD CONSTRAINT "user_reward_cycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycle_progress_events" ADD CONSTRAINT "urc_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycle_progress_events" ADD CONSTRAINT "urc_progress_cycle_id_fkey" FOREIGN KEY ("user_reward_cycle_id") REFERENCES "user_reward_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycle_progress_events" ADD CONSTRAINT "urc_progress_wallet_tx_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycle_progress_events" ADD CONSTRAINT "urc_progress_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_cycle_progress_events" ADD CONSTRAINT "urc_progress_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_tier_claims" ADD CONSTRAINT "urt_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_tier_claims" ADD CONSTRAINT "urt_claims_cycle_id_fkey" FOREIGN KEY ("user_reward_cycle_id") REFERENCES "user_reward_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_tier_claims" ADD CONSTRAINT "urt_claims_tier_id_fkey" FOREIGN KEY ("reward_tier_id") REFERENCES "reward_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reward_tier_claims" ADD CONSTRAINT "urt_claims_reward_delivery_fkey" FOREIGN KEY ("reward_delivery_id") REFERENCES "reward_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "idempotency_keys" DROP CONSTRAINT "idempotency_keys_scope_check";
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_scope_check" CHECK ("scope" IN ('order_create', 'payment_webhook', 'reward_delivery', 'wallet_credit', 'wallet_debit', 'reward_tier_claim', 'reward_cycle_progress'));

INSERT INTO "store_packages" ("id", "code", "name", "up_amount", "price_cents", "currency", "is_active", "display_order", "metadata", "updated_at")
VALUES
('00000000-0000-0000-0000-000000000101', 'up_1000', '1.000 UP', 1000, 1000, 'BRL', true, 1, '{"publicBadge": null}'::jsonb, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000102', 'up_5000', '5.000 UP', 5000, 4500, 'BRL', true, 2, '{"publicBadge": "Mais popular"}'::jsonb, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000103', 'up_10000', '10.000 UP', 10000, 8000, 'BRL', true, 3, '{}'::jsonb, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000104', 'up_25000', '25.000 UP', 25000, 18000, 'BRL', true, 4, '{}'::jsonb, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000105', 'up_50000', '50.000 UP', 50000, 32000, 'BRL', true, 5, '{"publicBadge": "Melhor valor"}'::jsonb, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000106', 'up_100000', '100.000 UP', 100000, 60000, 'BRL', true, 6, '{}'::jsonb, CURRENT_TIMESTAMP);

INSERT INTO "reward_tiers" ("id", "code", "name", "required_up_total", "display_order", "is_active", "updated_at")
VALUES
('00000000-0000-0000-0000-000000001001', 'rank_1', 'Rank 1', 10000, 1, true, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000001002', 'rank_2', 'Rank 2', 20000, 2, true, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000001003', 'rank_3', 'Rank 3', 35000, 3, true, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000001004', 'rank_4', 'Rank 4', 50000, 4, true, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000001005', 'rank_5', 'Rank 5', 75000, 5, true, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000001006', 'rank_6', 'Rank 6', 100000, 6, true, CURRENT_TIMESTAMP);

INSERT INTO "reward_tier_items" ("id", "reward_tier_id", "item_name", "item_description", "game_item_id", "quantity", "display_order", "updated_at")
VALUES
('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000001001', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_1', 1, 1, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000001002', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_2', 1, 1, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000001003', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_3', 1, 1, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000001004', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_4', 1, 1, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-000000001005', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_5', 1, 1, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000002006', '00000000-0000-0000-0000-000000001006', 'Aqui vai o item', null, 'PLACEHOLDER_RANK_6', 1, 1, CURRENT_TIMESTAMP);
