import { config } from "dotenv";
import { z } from "zod";

config();

const booleanStringSchema = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const optionalEmailStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  SESSION_COOKIE_NAME: z.string().min(1).default("site_universe_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ACCOUNT_MIGRATION_COOKIE_NAME: z
    .string()
    .min(1)
    .default("site_universe_migration"),
  ACCOUNT_MIGRATION_SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(24),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GLOBAL_WINDOW: z.string().min(1).default("1 minute"),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW: z.string().min(1).default("1 minute"),
  LOGIN_ACCOUNT_LOCK_MAX_FAILURES: z.coerce.number().int().positive().default(5),
  LOGIN_ACCOUNT_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  REGISTER_RATE_LIMIT_WINDOW: z.string().min(1).default("10 minutes"),
  PASSWORD_RESET_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  PASSWORD_RESET_RATE_LIMIT_WINDOW: z.string().min(1).default("15 minutes"),
  EMAIL_VERIFICATION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  EMAIL_VERIFICATION_RATE_LIMIT_WINDOW: z.string().min(1).default("15 minutes"),
  ACCOUNT_MIGRATION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  ACCOUNT_MIGRATION_RATE_LIMIT_WINDOW: z.string().min(1).default("15 minutes"),
  GF_DB_HOST: z.string().optional(),
  GF_DB_PORT: z.coerce.number().int().positive().default(5432),
  GF_DB_USER: z.string().optional(),
  GF_DB_PASSWORD: z.string().optional(),
  GF_DB_NAME: z.string().min(1).default("gf_ms"),
  GF_ACCOUNT_DB_NAME: z.string().min(1).default("gf_ls"),
  GF_DB_SSL: booleanStringSchema,
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  MERCADO_PAGO_TEST_PAYER_EMAIL: optionalEmailStringSchema,
  PAYMENT_SUCCESS_URL: z.string().url().optional(),
  PAYMENT_FAILURE_URL: z.string().url().optional(),
  PAYMENT_PENDING_URL: z.string().url().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
