import { z } from "zod";

export const authCookieSchema = z.object({
  sessionToken: z.string().min(32)
});

export const authenticatedUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  status: z.string(),
  emailVerifiedAt: z.date().nullable()
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
