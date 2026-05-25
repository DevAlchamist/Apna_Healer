import { z } from "zod";

export const providerQuerySchema = z.object({
  role: z.enum(["THERAPIST", "LISTENER"]).optional(),
  query: z.string().trim().max(100).optional(),
  specialization: z.string().trim().max(100).optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});
