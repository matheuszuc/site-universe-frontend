import { z } from "zod";

// GF-compatible: only lowercase letters a-z and digits 0-9, min 10 chars
const passwordSchema = z
  .string()
  .min(10, "A senha deve ter no mínimo 10 caracteres.")
  .max(64, "A senha deve ter no máximo 64 caracteres.")
  .regex(
    /^[a-z0-9]+$/,
    "A senha deve usar apenas letras minúsculas e números."
  );

// Registration username = the GF game login (mid). Must be game-login compatible:
// only letters and digits (no spaces, accents, HTML, or control chars), matching
// the frontend username rule. Alphanumeric-only is inherently XSS-safe.
const nameSchema = z
  .string()
  .trim()
  .min(3, "O nome de usuário deve ter no mínimo 3 caracteres.")
  .max(20, "O nome de usuário deve ter no máximo 20 caracteres.")
  .regex(
    /^[A-Za-z0-9]+$/,
    "O nome de usuário deve usar apenas letras e números."
  );

export const registerSchema = z.object({
  name: nameSchema,
  email: z.string().trim().email(),
  password: passwordSchema,
  recaptchaToken: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
  recaptchaToken: z.string().optional()
});

export const emailOnlySchema = z.object({
  email: z.string().trim().email()
});

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(32)
});

export const verifyEmailCodeSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6,8}$/)
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema
});

export const authCookieSchema = z.object({
  sessionToken: z.string().min(32)
});

export const authenticatedUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  status: z.string(),
  emailVerified: z.boolean()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;
export type VerifyEmailQuery = z.infer<typeof verifyEmailQuerySchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
