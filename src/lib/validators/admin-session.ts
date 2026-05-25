import { z } from "zod";

const adminOperationsStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "UPCOMING",
  "ONGOING",
  "MISSED",
]);

export const adminSessionsQuerySchema = z.object({
  status: adminOperationsStatusSchema.optional(),
  /** ISO date (`YYYY-MM-DD`) or datetime */
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
});

export type AdminSessionsQuery = z.infer<typeof adminSessionsQuerySchema>;
