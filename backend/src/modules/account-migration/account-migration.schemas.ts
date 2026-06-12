import { z } from "zod";

// GF-compatible site password: only lowercase letters a-z and digits 0-9, min 10.
// Must match the registration rule and the frontend migration form. The previous
// "strong password" (uppercase + symbol) here was incompatible with the GF rule,
// which made completing a migration impossible.
const gfSitePasswordSchema = z
  .string()
  .min(10, "A senha deve ter no mínimo 10 caracteres.")
  .max(64, "A senha deve ter no máximo 64 caracteres.")
  .regex(/^[a-z0-9]+$/, "A senha deve usar apenas letras minúsculas e números.");

export const startAccountMigrationSchema = z.object({
  gameLogin: z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9]+$/),
  currentPassword: z.string().min(1).max(128),
  recaptchaToken: z.string().optional()
});

export const completeAccountMigrationSchema = z
  .object({
    email: z.string().trim().email(),
    newPassword: gfSitePasswordSchema,
    confirmPassword: z.string().min(1).max(64)
  })
  .strict()
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

export type StartAccountMigrationInput = z.infer<typeof startAccountMigrationSchema>;
export type CompleteAccountMigrationInput = z.infer<typeof completeAccountMigrationSchema>;
