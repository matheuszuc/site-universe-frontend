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

// Display name: letters (including accented), digits, spaces, hyphens, apostrophes
// No HTML tags, control chars, or more than one consecutive space
const nameSchema = z
  .string()
  .trim()
  .min(2, "O nome deve ter no mínimo 2 caracteres.")
  .max(60, "O nome deve ter no máximo 60 caracteres.")
  .regex(
    /^[\p{L}\p{N} '\-\.]+$/u,
    "O nome contém caracteres inválidos."
  )
  .refine(
    (v) => !/\s{2,}/.test(v),
    "O nome não pode ter espaços consecutivos."
  )
  .transform((v) => v.replace(/\s+/g, " ").trim());

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
