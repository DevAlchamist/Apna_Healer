import type { AuditActionValue } from "@/types/api";

export type AuditCategory = "users" | "applications" | "bookings" | "sessions" | "payouts";

export function auditActionCategory(action: AuditActionValue): AuditCategory {
  switch (action) {
    case "USER_UPDATED_BY_ADMIN":
      return "users";
    case "APPLICATION_REVIEWED":
      return "applications";
    case "BOOKING_STATUS_CHANGED":
    case "LISTENER_REQUEST_UPDATED":
      return "bookings";
    case "SESSION_STATUS_CHANGED":
      return "sessions";
    case "WALLET_TRANSACTION":
      return "payouts";
    default:
      return "users";
  }
}
