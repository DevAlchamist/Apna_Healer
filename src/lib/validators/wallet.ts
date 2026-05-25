import { z } from "zod";
import { moneyAmountSchema } from "@/lib/validators/common";

export const walletMutationSchema = z.object({
  amount: moneyAmountSchema,
});

export const transactionQuerySchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});
