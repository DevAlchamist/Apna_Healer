import { z } from "zod";

export const moneyAmountSchema = z
  .number()
  .positive()
  .refine((value) => Number.isFinite(value) && Math.round(value * 100) === value * 100, {
    message: "Amount must have at most two decimal places.",
  });

export const optionalPaginationQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(100).optional(),
});
