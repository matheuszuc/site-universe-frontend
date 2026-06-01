import { z } from 'zod'
import { formMessages } from '../../../utils/formMessages'

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, formMessages.requiredEmail).email(formMessages.invalidEmail),
})
