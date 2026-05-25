import { z } from "zod";

export const adminFinanceQuerySchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
  type: z
    .enum(["CREDIT", "DEBIT", "REFUND", "SESSION_PAYMENT", "PAYOUT"])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});

export type AdminFinanceQuery = z.infer<typeof adminFinanceQuerySchema>;
