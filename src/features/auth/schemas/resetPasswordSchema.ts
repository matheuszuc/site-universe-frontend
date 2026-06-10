import { z } from 'zod'
import { formMessages } from '../../../utils/formMessages'

// GF-compatible: only lowercase letters a-z and digits 0-9, min 10 chars
const passwordRegex = /^[a-z0-9]{10,64}$/

export const resetPasswordSchema = z
  .object({
    password: z.string().min(1, formMessages.requiredPassword).regex(passwordRegex, formMessages.passwordStrength),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: formMessages.passwordConfirmation,
    path: ['confirmPassword'],
  })
