import { z } from 'zod'
import { formMessages } from '../../../utils/formMessages'

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\sA-Za-z0-9])\S{8,}$/

export const resetPasswordSchema = z
  .object({
    password: z.string().min(1, formMessages.requiredPassword).regex(passwordRegex, formMessages.passwordStrength),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: formMessages.passwordConfirmation,
    path: ['confirmPassword'],
  })
