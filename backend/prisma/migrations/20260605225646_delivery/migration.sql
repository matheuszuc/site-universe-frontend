/*
  Warnings:

  - A unique constraint covering the columns `[game_account_id]` on the table `game_accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reward_tier_claim_id]` on the table `game_deliveries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `user_reward_tier_claims` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "game_deliveries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_events_pkey" TO "user_reward_cycle_progress_events_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "game_accounts_game_account_id_key" ON "game_accounts"("game_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_deliveries_reward_tier_claim_id_key" ON "game_deliveries"("reward_tier_claim_id");

-- CreateIndex
CREATE INDEX "legacy_account_migration_sessions_session_token_hash_idx" ON "legacy_account_migration_sessions"("session_token_hash");

-- CreateIndex
CREATE INDEX "reward_deliveries_status_next_retry_at_idx" ON "reward_deliveries"("status", "next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_reward_tier_claims_idempotency_key_key" ON "user_reward_tier_claims"("idempotency_key");

-- RenameForeignKey
ALTER TABLE "reward_tier_items" RENAME CONSTRAINT "reward_tier_items_tier_id_fkey" TO "reward_tier_items_reward_tier_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_cycle_id_fkey" TO "user_reward_cycle_progress_events_user_reward_cycle_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_order_id_fkey" TO "user_reward_cycle_progress_events_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_payment_id_fkey" TO "user_reward_cycle_progress_events_payment_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_user_id_fkey" TO "user_reward_cycle_progress_events_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_cycle_progress_events" RENAME CONSTRAINT "urc_progress_wallet_tx_fkey" TO "user_reward_cycle_progress_events_wallet_transaction_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_tier_claims" RENAME CONSTRAINT "urt_claims_cycle_id_fkey" TO "user_reward_tier_claims_user_reward_cycle_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_tier_claims" RENAME CONSTRAINT "urt_claims_reward_delivery_fkey" TO "user_reward_tier_claims_reward_delivery_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_tier_claims" RENAME CONSTRAINT "urt_claims_tier_id_fkey" TO "user_reward_tier_claims_reward_tier_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_reward_tier_claims" RENAME CONSTRAINT "urt_claims_user_id_fkey" TO "user_reward_tier_claims_user_id_fkey";

-- RenameIndex
ALTER INDEX "email_verification_tokens_user_created_idx" RENAME TO "email_verification_tokens_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "game_deliveries_status_created_idx" RENAME TO "game_deliveries_status_created_at_idx";

-- RenameIndex
ALTER INDEX "game_deliveries_user_created_idx" RENAME TO "game_deliveries_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "legacy_account_migration_sessions_status_expires_idx" RENAME TO "legacy_account_migration_sessions_status_expires_at_idx";

-- RenameIndex
ALTER INDEX "legacy_account_migration_sessions_token_key" RENAME TO "legacy_account_migration_sessions_session_token_hash_key";

-- RenameIndex
ALTER INDEX "reward_tier_items_tier_id_idx" RENAME TO "reward_tier_items_reward_tier_id_idx";

-- RenameIndex
ALTER INDEX "reward_tier_items_tier_order_idx" RENAME TO "reward_tier_items_reward_tier_id_display_order_idx";

-- RenameIndex
ALTER INDEX "reward_tiers_active_order_idx" RENAME TO "reward_tiers_is_active_display_order_idx";

-- RenameIndex
ALTER INDEX "store_packages_active_order_idx" RENAME TO "store_packages_is_active_display_order_idx";

-- RenameIndex
ALTER INDEX "urc_progress_cycle_created_idx" RENAME TO "user_reward_cycle_progress_events_user_reward_cycle_id_crea_idx";

-- RenameIndex
ALTER INDEX "urc_progress_order_id_idx" RENAME TO "user_reward_cycle_progress_events_order_id_idx";

-- RenameIndex
ALTER INDEX "urc_progress_payment_id_idx" RENAME TO "user_reward_cycle_progress_events_payment_id_idx";

-- RenameIndex
ALTER INDEX "urc_progress_source_key" RENAME TO "user_reward_cycle_progress_events_source_type_source_id_key";

-- RenameIndex
ALTER INDEX "urc_progress_user_created_idx" RENAME TO "user_reward_cycle_progress_events_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "urc_progress_wallet_tx_key" RENAME TO "user_reward_cycle_progress_events_wallet_transaction_id_key";

-- RenameIndex
ALTER INDEX "user_reward_cycles_user_created_idx" RENAME TO "user_reward_cycles_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "user_reward_cycles_user_cycle_key" RENAME TO "user_reward_cycles_user_id_cycle_number_key";

-- RenameIndex
ALTER INDEX "user_reward_cycles_user_status_idx" RENAME TO "user_reward_cycles_user_id_status_idx";

-- RenameIndex
ALTER INDEX "urt_claims_cycle_id_idx" RENAME TO "user_reward_tier_claims_user_reward_cycle_id_idx";

-- RenameIndex
ALTER INDEX "urt_claims_cycle_tier_key" RENAME TO "user_reward_tier_claims_user_reward_cycle_id_reward_tier_id_key";

-- RenameIndex
ALTER INDEX "urt_claims_delivery_created_idx" RENAME TO "user_reward_tier_claims_delivery_status_created_at_idx";

-- RenameIndex
ALTER INDEX "urt_claims_status_created_idx" RENAME TO "user_reward_tier_claims_status_created_at_idx";

-- RenameIndex
ALTER INDEX "urt_claims_tier_id_idx" RENAME TO "user_reward_tier_claims_reward_tier_id_idx";

-- RenameIndex
ALTER INDEX "urt_claims_user_created_idx" RENAME TO "user_reward_tier_claims_user_id_created_at_idx";
