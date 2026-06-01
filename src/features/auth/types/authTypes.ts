import type { z } from 'zod'
import type { forgotPasswordSchema } from '../schemas/forgotPasswordSchema'
import type { loginSchema } from '../schemas/loginSchema'
import type { registerSchema } from '../schemas/registerSchema'
import type { resetPasswordSchema } from '../schemas/resetPasswordSchema'

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export type AuthApiResult = {
  ok: boolean
  message: string
}
