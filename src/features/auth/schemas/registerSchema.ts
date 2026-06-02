import { z } from 'zod'
import { formMessages } from '../../../utils/formMessages'

const usernameRegex = /^[A-Za-z0-9]+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\sA-Za-z0-9])\S{8,64}$/

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Nome de usuário obrigatório.')
      .min(3, formMessages.username)
      .max(20, formMessages.username)
      .regex(usernameRegex, formMessages.username),
    email: z.string().min(1, formMessages.requiredEmail).email(formMessages.invalidEmail),
    password: z.string().min(1, formMessages.requiredPassword).regex(passwordRegex, formMessages.passwordStrength),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    terms: z.boolean().refine((value) => value, 'Você precisa aceitar os termos.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: formMessages.passwordConfirmation,
    path: ['confirmPassword'],
  })
