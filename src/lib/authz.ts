import { Role } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";

export type BookingScope = "requester" | "provider" | "all";
export type SessionScope = "participant" | "provider" | "all" | "both";

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === Role.ADMIN;
}

export function isProviderRole(role: Role | null | undefined) {
  return role === Role.THERAPIST || role === Role.LISTENER;
}

export function isProviderOrAdmin(role: Role | null | undefined) {
  return isProviderRole(role) || isAdminRole(role);
}

export function assertRole(
  role: Role,
  allowed: readonly Role[],
  message = "You do not have access to this resource.",
  code = "FORBIDDEN",
): void {
  if (!allowed.includes(role)) {
    throw new ApiError(403, message, code);
  }
}

export function assertAdmin(
  role: Role,
  message = "Only admins can perform this action.",
  code = "FORBIDDEN",
): void {
  if (!isAdminRole(role)) {
    throw new ApiError(403, message, code);
  }
}

export function assertProviderAccess(
  role: Role,
  message = "Only providers can perform this action.",
  code = "FORBIDDEN",
): void {
  if (!isProviderOrAdmin(role)) {
    throw new ApiError(403, message, code);
  }
}

type ResourceActor = {
  actorId: string;
  actorRole: Role;
};

type ResourceParticipants = {
  userId: string;
  providerId: string;
};

export function canAccessResource(
  actor: ResourceActor,
  resource: ResourceParticipants,
): boolean {
  if (isAdminRole(actor.actorRole)) return true;
  return resource.userId === actor.actorId || resource.providerId === actor.actorId;
}

export function assertResourceParticipant(
  actor: ResourceActor,
  resource: ResourceParticipants,
  message = "You do not have access to this resource.",
  code = "FORBIDDEN",
): void {
  if (!canAccessResource(actor, resource)) {
    throw new ApiError(403, message, code);
  }
}

export function assertResourceProvider(
  actor: ResourceActor,
  resource: { providerId: string },
  message = "Only the provider on this resource can manage it.",
  code = "FORBIDDEN",
): void {
  if (isAdminRole(actor.actorRole)) return;
  if (resource.providerId !== actor.actorId) {
    throw new ApiError(403, message, code);
  }
}

export function assertBookingScope(role: Role, scope: BookingScope): void {
  if (scope === "all" && !isAdminRole(role)) {
    throw new ApiError(403, "Only admins can list all bookings.", "FORBIDDEN_SCOPE");
  }
  if (scope === "provider" && role === Role.USER) {
    throw new ApiError(403, "Only providers can view provider bookings.", "FORBIDDEN_SCOPE");
  }
}

export function assertSessionScope(role: Role, scope: SessionScope): void {
  if (scope === "all" && !isAdminRole(role)) {
    throw new ApiError(403, "Only admins can list all sessions.", "FORBIDDEN_SCOPE");
  }
  if (scope === "provider" && role === Role.USER) {
    throw new ApiError(403, "Only providers can view provider sessions.", "FORBIDDEN_SCOPE");
  }
  if (scope === "both" && !isProviderRole(role)) {
    throw new ApiError(403, "This session scope is only for listener and therapist accounts.", "FORBIDDEN_SCOPE");
  }
}

export function defaultBookingScope(role: Role): BookingScope {
  return isAdminRole(role) ? "all" : "requester";
}

export function defaultSessionScope(role: Role): SessionScope {
  if (isAdminRole(role)) return "all";
  if (isProviderRole(role)) return "both";
  return "participant";
}
