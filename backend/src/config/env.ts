import { config } from "dotenv";
import { z } from "zod";

config();

const booleanStringSchema = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  APP_PUBLIC_URL: z.string().url().default("http://localhost:5173"),
  SESSION_COOKIE_NAME: z.string().min(1).default("site_universe_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ACCOUNT_MIGRATION_COOKIE_NAME: z
    .string()
    .min(1)
    .default("site_universe_migration"),
  ACCOUNT_MIGRATION_SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("Site Universe <noreply@siteuniverse.com>"),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(24),
  EMAIL_VERIFICATION_EXPIRES_MINUTES: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_CODE_LENGTH: z.coerce.number().int().min(6).max(8).default(6),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  EMAIL_VERIFICATION_MAX_PER_HOUR: z.coerce.number().int().positive().default(5),
  EMAIL_REQUIRE_VERIFIED: booleanStringSchema.default(true),
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
  ACCOUNT_MIGRATION_ENABLED: booleanStringSchema.default(true),
  RECAPTCHA_ENABLED: booleanStringSchema.default(false),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  SINGLE_ACTIVE_SESSION: booleanStringSchema.default(false),
  GF_DB_HOST: z.string().optional(),
  GF_DB_PORT: z.coerce.number().int().positive().default(5432),
  GF_DB_USER: z.string().optional(),
  GF_DB_PASSWORD: z.string().optional(),
  GF_DB_NAME: z.string().min(1).default("gf_ms"),
  GF_ACCOUNT_DB_NAME: z.string().min(1).default("gf_ls"),
  GF_DB_SSL: booleanStringSchema,
  GAME_DELIVERY_ENABLED: booleanStringSchema.default(false),
  GAME_ACCOUNT_CREATION_ENABLED: booleanStringSchema.default(true),
  // Provedor de pagamento Pix. O Site Universe aceita SOMENTE Pix via OpenPix/Woovi.
  PAYMENT_PROVIDER: z.enum(["openpix"]).default("openpix"),
  // OPENPIX_APP_ID e segredos NUNCA vao para o frontend (sem prefixo VITE_).
  OPENPIX_APP_ID: z.string().optional(),
  OPENPIX_BASE_URL: z.string().url().default("https://api.openpix.com.br"),
  OPENPIX_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  OPENPIX_WEBHOOK_SECRET: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";

// Em producao com OpenPix selecionado, o pagamento nao pode iniciar com config
// incompleta. Falha forte de startup evita rodar a loja sem provider Pix valido.
if (isProduction && env.PAYMENT_PROVIDER === "openpix" && !env.OPENPIX_APP_ID) {
  console.error(
    "Invalid environment configuration: OPENPIX_APP_ID is required when PAYMENT_PROVIDER=openpix in production"
  );
  process.exit(1);
}
