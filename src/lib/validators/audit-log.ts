import { Role } from "@prisma/client";
import { z } from "zod";

const auditCategorySchema = z.enum([
  "users",
  "applications",
  "bookings",
  "sessions",
  "payouts",
  "clubs",
  "events",
]);

const auditActionSchema = z.enum([
  "USER_UPDATED_BY_ADMIN",
  "APPLICATION_REVIEWED",
  "BOOKING_STATUS_CHANGED",
  "SESSION_STATUS_CHANGED",
  "LISTENER_REQUEST_UPDATED",
  "WALLET_TRANSACTION",
  "CLUB_CREATED",
  "CLUB_UPDATED",
  "CLUB_CREATION_REVIEWED",
  "CLUB_JOIN_REVIEWED",
  "CLUB_MEMBERSHIP_BILLING",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_REGISTRATION_CREATED",
]);

const auditRoleFilterSchema = z.union([
  z.nativeEnum(Role),
  z.literal("SYSTEM"),
]);

export const adminAuditQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  cursor: z.string().trim().min(1).optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
  category: auditCategorySchema.optional(),
  action: auditActionSchema.optional(),
  role: auditRoleFilterSchema.optional(),
  targetType: z.string().trim().max(64).optional(),
});
