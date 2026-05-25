import { z } from "zod";
import { moneyAmountSchema } from "@/lib/validators/common";

export const bookingPaymentMethodSchema = z.enum(["WALLET", "QR", "CARD"]);

export const createBookingSchema = z
  .object({
    providerId: z.string().min(1),
    type: z.literal("THERAPIST"),
    requestedDate: z.string().datetime(),
    requestedTime: z.string().min(1),
    duration: z.coerce.number().int().positive().max(480),
    amount: moneyAmountSchema,
    paymentMethod: bookingPaymentMethodSchema.optional(),
    note: z.string().trim().max(500).optional(),
  })

export const updateBookingStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"]),
  meetingLink: z.string().url().optional(),
  description: z.string().trim().max(500).optional(),
});

export const bookingQuerySchema = z.object({
  scope: z.enum(["requester", "provider", "all"]).optional(),
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"])
    .optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});
