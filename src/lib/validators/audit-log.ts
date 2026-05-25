import { z } from "zod";

const auditCategorySchema = z.enum(["users", "applications", "bookings", "sessions", "payouts"]);

const auditActionSchema = z.enum([
  "USER_UPDATED_BY_ADMIN",
  "APPLICATION_REVIEWED",
  "BOOKING_STATUS_CHANGED",
  "SESSION_STATUS_CHANGED",
  "LISTENER_REQUEST_UPDATED",
  "WALLET_TRANSACTION",
]);

export const adminAuditQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().trim().min(1).optional(),
  category: auditCategorySchema.optional(),
  action: auditActionSchema.optional(),
  targetType: z.string().trim().max(64).optional(),
});
