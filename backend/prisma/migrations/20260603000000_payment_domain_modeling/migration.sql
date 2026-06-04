-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "package_id" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "reward_type" TEXT NOT NULL,
    "reward_amount" INTEGER NOT NULL,
    "payment_id" UUID,
    "paid_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_status_check" CHECK ("status" IN ('pending_payment', 'paid', 'fulfilled', 'expired', 'cancelled', 'refunded', 'chargeback', 'failed')),
    CONSTRAINT "orders_amount_cents_check" CHECK ("amount_cents" > 0),
    CONSTRAINT "orders_reward_amount_check" CHECK ("reward_amount" > 0)
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "provider_event_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "approved_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "raw_provider_status" TEXT,
    "provider_payload_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_status_check" CHECK ("status" IN ('pending', 'processing', 'approved', 'rejected', 'expired', 'cancelled', 'refunded', 'chargeback', 'disputed', 'failed')),
    CONSTRAINT "payments_amount_cents_check" CHECK ("amount_cents" > 0)
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency_type" TEXT NOT NULL,
    "order_id" UUID,
    "payment_id" UUID,
    "reward_delivery_id" UUID,
    "source_type" TEXT,
    "source_id" TEXT,
    "idempotency_key" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallet_transactions_type_check" CHECK ("type" IN ('credit_purchase', 'debit_game_delivery', 'debit_spend', 'refund_reversal', 'chargeback_reversal', 'admin_adjustment_future')),
    CONSTRAINT "wallet_transactions_status_check" CHECK ("status" IN ('pending', 'posted', 'reversed', 'cancelled', 'failed')),
    CONSTRAINT "wallet_transactions_amount_check" CHECK ("amount" <> 0)
);

-- CreateTable
CREATE TABLE "reward_deliveries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "wallet_transaction_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "reward_amount" INTEGER NOT NULL,
    "game_user_id" TEXT,
    "game_delivery_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 10,
    "next_retry_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "last_error" TEXT,
    "game_response_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reward_deliveries_status_check" CHECK ("status" IN ('pending', 'processing', 'delivered', 'retry_scheduled', 'failed', 'dead_letter', 'cancelled')),
    CONSTRAINT "reward_deliveries_reward_amount_check" CHECK ("reward_amount" > 0),
    CONSTRAINT "reward_deliveries_attempt_count_check" CHECK ("attempt_count" >= 0),
    CONSTRAINT "reward_deliveries_max_attempts_check" CHECK ("max_attempts" > 0)
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" UUID,
    "request_method" TEXT,
    "request_path" TEXT,
    "request_hash" TEXT,
    "status" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "locked_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "idempotency_keys_scope_check" CHECK ("scope" IN ('order_create', 'payment_webhook', 'reward_delivery', 'wallet_credit', 'wallet_debit')),
    CONSTRAINT "idempotency_keys_status_check" CHECK ("status" IN ('processing', 'succeeded', 'failed', 'expired'))
);

-- CreateTable
CREATE TABLE "payment_audit_logs" (
    "id" UUID NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "user_id" UUID,
    "order_id" UUID,
    "payment_id" UUID,
    "reward_delivery_id" UUID,
    "wallet_transaction_id" UUID,
    "idempotency_key" TEXT,
    "request_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_audit_logs_actor_type_check" CHECK ("actor_type" IN ('user', 'system', 'webhook', 'worker', 'admin_future'))
);

-- Indexes
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE UNIQUE INDEX "orders_payment_id_key" ON "orders"("payment_id");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");
CREATE UNIQUE INDEX "payments_provider_provider_payment_id_key" ON "payments"("provider", "provider_payment_id") WHERE "provider_payment_id" IS NOT NULL;
CREATE UNIQUE INDEX "payments_one_approved_per_order_key" ON "payments"("order_id") WHERE "status" = 'approved';
CREATE UNIQUE INDEX "wallet_transactions_reward_delivery_id_key" ON "wallet_transactions"("reward_delivery_id");
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE INDEX "wallet_transactions_user_id_created_at_idx" ON "wallet_transactions"("user_id", "created_at" DESC);
CREATE INDEX "wallet_transactions_status_created_at_idx" ON "wallet_transactions"("status", "created_at");
CREATE INDEX "wallet_transactions_order_id_idx" ON "wallet_transactions"("order_id");
CREATE INDEX "wallet_transactions_payment_id_idx" ON "wallet_transactions"("payment_id");
CREATE UNIQUE INDEX "wallet_transactions_credit_purchase_payment_key" ON "wallet_transactions"("payment_id") WHERE "type" = 'credit_purchase' AND "payment_id" IS NOT NULL;
CREATE UNIQUE INDEX "reward_deliveries_payment_id_key" ON "reward_deliveries"("payment_id");
CREATE UNIQUE INDEX "reward_deliveries_wallet_transaction_id_key" ON "reward_deliveries"("wallet_transaction_id");
CREATE UNIQUE INDEX "reward_deliveries_idempotency_key_key" ON "reward_deliveries"("idempotency_key");
CREATE INDEX "reward_deliveries_user_id_created_at_idx" ON "reward_deliveries"("user_id", "created_at" DESC);
CREATE INDEX "reward_deliveries_status_next_retry_at_idx" ON "reward_deliveries"("status", "next_retry_at") WHERE "status" IN ('pending', 'retry_scheduled');
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");
CREATE INDEX "idempotency_keys_user_id_idx" ON "idempotency_keys"("user_id");
CREATE INDEX "idempotency_keys_status_expires_at_idx" ON "idempotency_keys"("status", "expires_at");
CREATE INDEX "payment_audit_logs_user_id_idx" ON "payment_audit_logs"("user_id");
CREATE INDEX "payment_audit_logs_order_id_idx" ON "payment_audit_logs"("order_id");
CREATE INDEX "payment_audit_logs_payment_id_idx" ON "payment_audit_logs"("payment_id");
CREATE INDEX "payment_audit_logs_reward_delivery_id_idx" ON "payment_audit_logs"("reward_delivery_id");
CREATE INDEX "payment_audit_logs_event_type_idx" ON "payment_audit_logs"("event_type");
CREATE INDEX "payment_audit_logs_created_at_idx" ON "payment_audit_logs"("created_at");

-- Foreign keys
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reward_delivery_id_fkey" FOREIGN KEY ("reward_delivery_id") REFERENCES "reward_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reward_deliveries" ADD CONSTRAINT "reward_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reward_deliveries" ADD CONSTRAINT "reward_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reward_deliveries" ADD CONSTRAINT "reward_deliveries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reward_deliveries" ADD CONSTRAINT "reward_deliveries_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_reward_delivery_id_fkey" FOREIGN KEY ("reward_delivery_id") REFERENCES "reward_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_wallet_transaction_id_fkey" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
