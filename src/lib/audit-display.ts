import type { ApiAuditLogEntry, AuditActionValue } from "@/types/api";

export type AuditCategory =
  | "users"
  | "applications"
  | "bookings"
  | "sessions"
  | "payouts"
  | "clubs"
  | "events";

export const AUDIT_ACTION_OPTIONS: { value: AuditActionValue | ""; label: string }[] = [
  { value: "", label: "All Actions" },
  { value: "USER_UPDATED_BY_ADMIN", label: "User Updated" },
  { value: "APPLICATION_REVIEWED", label: "Application Reviewed" },
  { value: "BOOKING_STATUS_CHANGED", label: "Booking Changed" },
  { value: "SESSION_STATUS_CHANGED", label: "Session Changed" },
  { value: "LISTENER_REQUEST_UPDATED", label: "Listener Request Updated" },
  { value: "WALLET_TRANSACTION", label: "Wallet Transaction" },
  { value: "CLUB_CREATED", label: "Club Created" },
  { value: "CLUB_UPDATED", label: "Club Updated" },
  { value: "CLUB_CREATION_REVIEWED", label: "Club Creation Reviewed" },
  { value: "CLUB_JOIN_REVIEWED", label: "Club Join Reviewed" },
  { value: "CLUB_MEMBERSHIP_BILLING", label: "Club Billing" },
  { value: "EVENT_CREATED", label: "Event Created" },
  { value: "EVENT_UPDATED", label: "Event Updated" },
  { value: "EVENT_REGISTRATION_CREATED", label: "Event Registration" },
  { value: "ROLE_THEME_UPDATED", label: "Theme Updated" },
  { value: "ROLE_THEME_RESET", label: "Theme Reset" },
];

export const AUDIT_ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "THERAPIST", label: "Healer" },
  { value: "LISTENER", label: "Listener" },
  { value: "USER", label: "Member" },
  { value: "SYSTEM", label: "System" },
] as const;

export const AUDIT_DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "", label: "All Time" },
] as const;

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
    case "CLUB_CREATED":
    case "CLUB_UPDATED":
    case "CLUB_CREATION_REVIEWED":
    case "CLUB_JOIN_REVIEWED":
    case "CLUB_MEMBERSHIP_BILLING":
      return "clubs";
    case "EVENT_CREATED":
    case "EVENT_UPDATED":
    case "EVENT_REGISTRATION_CREATED":
      return "events";
    case "ROLE_THEME_UPDATED":
    case "ROLE_THEME_RESET":
      return "users";
    default:
      return "users";
  }
}

export function auditEntityLabel(targetType: string): string {
  const labels: Record<string, string> = {
    user: "User Profile",
    application: "Application",
    booking: "Booking",
    session: "Session ID",
    listener_request: "Listener Request",
    transaction: "Wallet Ledger",
    club: "Club",
    club_creation_request: "Club Request",
    club_join_request: "Join Request",
    club_membership: "Membership",
    event: "Event",
    event_registration: "Event Registration",
    role_theme: "Role Theme",
  };
  return labels[targetType] ?? "Platform Record";
}

export function auditEntityTone(
  targetType: string,
): "user" | "session" | "setting" | "default" {
  if (targetType === "user" || targetType === "application") return "user";
  if (targetType === "session" || targetType === "booking" || targetType === "listener_request") {
    return "session";
  }
  if (targetType === "transaction" || targetType === "club_membership") return "setting";
  return "default";
}

export function auditActorDisplayName(entry: ApiAuditLogEntry): string {
  if (entry.actorName) return entry.actorName;
  if (entry.actorEmail) {
    const local = entry.actorEmail.split("@")[0];
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "System";
}

export function auditActorRoleLabel(entry: ApiAuditLogEntry): string {
  if (!entry.actorId) return "SYSTEM";
  if (entry.actorRole === "THERAPIST") return "HEALER";
  return entry.actorRole ?? "SYSTEM";
}

export function auditActorInitials(entry: ApiAuditLogEntry): string {
  const name = auditActorDisplayName(entry);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function deriveAuditStatus(entry: ApiAuditLogEntry): "success" | "failed" {
  const details = entry.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const record = details as Record<string, unknown>;
    const status = String(record.status ?? "").toUpperCase();
    if (status === "FAILED" || status === "REJECTED") return "failed";

    const toStatus = String(record.toStatus ?? "").toUpperCase();
    if (
      toStatus === "REJECTED" ||
      toStatus === "DECLINED" ||
      toStatus === "CANCELLED" ||
      toStatus === "FAILED" ||
      toStatus === "MISSED"
    ) {
      return "failed";
    }
  }

  if (/\bfailed\b|\brejected\b|\bdeclined\b/i.test(entry.summary)) {
    return "failed";
  }

  return "success";
}

export function resolveAuditIpAddress(entry: ApiAuditLogEntry): string {
  const details = entry.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const ip = (details as Record<string, unknown>).ipAddress;
    if (typeof ip === "string" && ip.trim().length > 0) return ip;
  }
  if (!entry.actorId) return "Internal Node";
  return "Platform";
}
