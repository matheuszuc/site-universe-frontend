import { z } from 'zod'
import { formMessages } from '../../../utils/formMessages'

export const loginSchema = z.object({
  email: z.string().min(1, formMessages.requiredEmail).email(formMessages.invalidEmail),
  password: z.string().min(1, formMessages.requiredPassword),
})
