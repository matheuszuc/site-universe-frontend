CREATE TABLE "game_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "game_login" TEXT NOT NULL,
    "game_account_id" TEXT,
    "status" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "migrated_at" TIMESTAMP(3),
    "requires_email_verification" BOOLEAN NOT NULL DEFAULT true,
    "requires_password_update" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_accounts_status_check" CHECK ("status" IN ('linked', 'migrated', 'pending_email_verification', 'pending_game_password_update', 'disabled'))
);

CREATE TABLE "legacy_account_migration_sessions" (
    "id" UUID NOT NULL,
    "session_token_hash" TEXT NOT NULL,
    "game_login" TEXT NOT NULL,
    "game_account_id" TEXT,
    "status" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_hash" TEXT,
    "user_agent_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "legacy_account_migration_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "legacy_account_migration_sessions_status_check" CHECK ("status" IN ('verified', 'completed', 'expired', 'failed', 'cancelled')),
    CONSTRAINT "legacy_account_migration_sessions_attempts_check" CHECK ("attempts" >= 0)
);

CREATE TABLE "account_migration_audit_logs" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "game_login" TEXT,
    "user_id" UUID,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_migration_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_accounts_game_login_key" ON "game_accounts"("game_login");
CREATE UNIQUE INDEX "game_accounts_game_account_id_key" ON "game_accounts"("game_account_id") WHERE "game_account_id" IS NOT NULL;
CREATE INDEX "game_accounts_user_id_idx" ON "game_accounts"("user_id");
CREATE INDEX "game_accounts_status_idx" ON "game_accounts"("status");

CREATE UNIQUE INDEX "legacy_account_migration_sessions_token_key" ON "legacy_account_migration_sessions"("session_token_hash");
CREATE INDEX "legacy_account_migration_sessions_game_login_idx" ON "legacy_account_migration_sessions"("game_login");
CREATE INDEX "legacy_account_migration_sessions_status_expires_idx" ON "legacy_account_migration_sessions"("status", "expires_at");

CREATE INDEX "account_migration_audit_logs_event_type_idx" ON "account_migration_audit_logs"("event_type");
CREATE INDEX "account_migration_audit_logs_game_login_idx" ON "account_migration_audit_logs"("game_login");
CREATE INDEX "account_migration_audit_logs_user_id_idx" ON "account_migration_audit_logs"("user_id");
CREATE INDEX "account_migration_audit_logs_created_at_idx" ON "account_migration_audit_logs"("created_at");

ALTER TABLE "game_accounts" ADD CONSTRAINT "game_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "account_migration_audit_logs" ADD CONSTRAINT "account_migration_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
