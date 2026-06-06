ALTER TABLE "email_verification_tokens"
  ADD COLUMN "code_hash" TEXT,
  ADD COLUMN "sent_to_email" TEXT,
  ADD COLUMN "request_ip_hash" TEXT,
  ADD COLUMN "user_agent_hash" TEXT,
  ADD COLUMN "code_attempt_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "email_verification_tokens_user_created_idx"
  ON "email_verification_tokens"("user_id", "created_at");

UPDATE "reward_tiers"
SET
  "name" = updates."name",
  "required_up_total" = updates."required_up_total",
  "updated_at" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('rank_1', 'Rank 1', 3000),
    ('rank_2', 'Rank 2', 6000),
    ('rank_3', 'Rank 3', 10000),
    ('rank_4', 'Rank 4', 15000),
    ('rank_5', 'Rank 5', 22000),
    ('rank_6', 'Rank 6', 30000)
) AS updates("code", "name", "required_up_total")
WHERE "reward_tiers"."code" = updates."code";
