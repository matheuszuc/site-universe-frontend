import { z } from "zod";

export const createOrderSchema = z
  .object({
    packageCode: z.string().trim().min(1).max(80).optional(),
    packageId: z.string().trim().min(1).max(80).optional(),
    // CPF (11 digitos) ou CNPJ (14 digitos), somente numeros. Opcional: usado para
    // criar o customer no Asaas. NAO e persistido no banco (pendencia futura de LGPD).
    cpfCnpj: z
      .string()
      .regex(/^\d{11}$|^\d{14}$/)
      .optional()
  })
  .strict()
  .refine((value) => Boolean(value.packageCode ?? value.packageId), {
    message: "Package code is required"
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
