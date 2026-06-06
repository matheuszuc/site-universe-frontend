ALTER TABLE "reward_deliveries" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "reward_deliveries" ALTER COLUMN "payment_id" DROP NOT NULL;
ALTER TABLE "reward_deliveries" ALTER COLUMN "wallet_transaction_id" DROP NOT NULL;
