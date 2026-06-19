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
  COOKIE_SAME_SITE: z.enum(["lax", "none"]).default("lax"),
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
  // reCAPTCHA v3 devolve um "score" entre 0 e 1. Requisicoes com score abaixo
  // deste limite sao rejeitadas (RECAPTCHA_FAILED). Tokens v2 (sem score) nao
  // sao afetados por esta verificacao.
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),
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
  // Habilita o simulador de pagamento (POST /dev/payments/simulate-approved).
  // PROIBIDO em producao: o bloco de boot abaixo derruba o startup se isto for
  // true quando NODE_ENV=production. So tem efeito junto com NODE_ENV=development.
  ALLOW_PAYMENT_SIMULATOR: booleanStringSchema.default(false),
  // Provedor de pagamento Pix. O Site Universe aceita SOMENTE Pix, via Asaas.
  // Mercado Pago, Banco Inter e OpenPix NAO sao usados.
  PAYMENT_PROVIDER: z.enum(["asaas"]).default("asaas"),
  // ASAAS_ACCESS_TOKEN e ASAAS_WEBHOOK_TOKEN sao segredos: NUNCA vao para o git
  // nem para o frontend (sem prefixo VITE_).
  ASAAS_ACCESS_TOKEN: z.string().optional(),
  ASAAS_BASE_URL: z.string().url().default("https://api-sandbox.asaas.com/v3"),
  ASAAS_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  // Dias de vencimento da cobranca Pix (dueDate = hoje + N dias).
  ASAAS_PIX_DUE_DAYS: z.coerce.number().int().min(1).max(30).default(1)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";

// Gate unico do simulador de pagamento. Exige ambiente de desenvolvimento E a flag
// dedicada. Em producao e sempre false (o boot abaixo proibe a flag em prod).
export const isPaymentSimulatorEnabled = isDevelopment && env.ALLOW_PAYMENT_SIMULATOR;

// Em producao, configuracao insegura/incompleta deve impedir o boot. Evita rodar
// com pagamento mock/sandbox, e-mail mock, reCAPTCHA desligado por engano, CORS
// apontando para localhost ou segredos ausentes. NAO afeta desenvolvimento local
// (todo este bloco so roda quando NODE_ENV=production).
if (isProduction) {
  const productionErrors: string[] = [];
  const usesLocalhost = (value: string) => /localhost|127\.0\.0\.1/i.test(value);

  // O simulador de pagamento NUNCA pode estar ligado em producao.
  if (env.ALLOW_PAYMENT_SIMULATOR) {
    productionErrors.push("ALLOW_PAYMENT_SIMULATOR must not be true in production");
  }

  // CORS/links publicos nao podem apontar para localhost em producao.
  if (usesLocalhost(env.FRONTEND_URL)) {
    productionErrors.push("FRONTEND_URL must not point to localhost in production");
  }
  if (usesLocalhost(env.APP_PUBLIC_URL)) {
    productionErrors.push("APP_PUBLIC_URL must not point to localhost in production");
  }

  // E-mail real obrigatorio: "console" e um mock de desenvolvimento.
  if (env.EMAIL_PROVIDER !== "resend") {
    productionErrors.push('EMAIL_PROVIDER must be "resend" in production (console is a dev-only mock)');
  }
  if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
    productionErrors.push("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
  }

  // reCAPTCHA nao pode ser desativado por engano em producao.
  if (!env.RECAPTCHA_ENABLED) {
    productionErrors.push("RECAPTCHA_ENABLED must be true in production");
  }
  if (env.RECAPTCHA_ENABLED && !env.RECAPTCHA_SECRET_KEY) {
    productionErrors.push("RECAPTCHA_SECRET_KEY is required when RECAPTCHA_ENABLED=true");
  }

  // Pagamento Pix via Asaas: segredos presentes e ambiente de producao (sem sandbox).
  if (env.PAYMENT_PROVIDER === "asaas") {
    if (!env.ASAAS_ACCESS_TOKEN) {
      productionErrors.push("ASAAS_ACCESS_TOKEN is required when PAYMENT_PROVIDER=asaas in production");
    }
    if (!env.ASAAS_WEBHOOK_TOKEN) {
      productionErrors.push("ASAAS_WEBHOOK_TOKEN is required when PAYMENT_PROVIDER=asaas in production");
    }
    if (env.ASAAS_ENV !== "production") {
      productionErrors.push('ASAAS_ENV must be "production" in production');
    }
    if (/sandbox/i.test(env.ASAAS_BASE_URL)) {
      productionErrors.push("ASAAS_BASE_URL must not point to the Asaas sandbox in production");
    }
  }

  if (productionErrors.length > 0) {
    console.error(
      "Invalid production environment configuration:\n" +
        productionErrors.map((message) => `  - ${message}`).join("\n")
    );
    process.exit(1);
  }
}

if (env.RECAPTCHA_ENABLED && !env.RECAPTCHA_SECRET_KEY) {
  console.error(
    "Invalid environment configuration: RECAPTCHA_SECRET_KEY is required when RECAPTCHA_ENABLED=true"
  );
  process.exit(1);
}
