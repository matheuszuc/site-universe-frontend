import { z } from "zod";

export const createOrderSchema = z
  .object({
    packageCode: z.string().trim().min(1).max(80).optional(),
    packageId: z.string().trim().min(1).max(80).optional()
  })
  .strict()
  .refine((value) => Boolean(value.packageCode ?? value.packageId), {
    message: "Package code is required"
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
