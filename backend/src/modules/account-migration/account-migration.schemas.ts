import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const startAccountMigrationSchema = z.object({
  gameLogin: z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9]+$/),
  currentPassword: z.string().min(1).max(128)
});

export const completeAccountMigrationSchema = z
  .object({
    email: z.string().trim().email(),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1).max(64)
  })
  .strict()
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

export type StartAccountMigrationInput = z.infer<typeof startAccountMigrationSchema>;
export type CompleteAccountMigrationInput = z.infer<typeof completeAccountMigrationSchema>;
