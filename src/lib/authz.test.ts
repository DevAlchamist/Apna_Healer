import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "@/lib/api-errors";
import {
  assertAdmin,
  assertBookingScope,
  assertProviderAccess,
  assertResourceParticipant,
  assertResourceProvider,
  assertRole,
  assertSessionScope,
  canAccessResource,
  defaultBookingScope,
  defaultSessionScope,
  isAdminRole,
  isProviderOrAdmin,
  isProviderRole,
} from "@/lib/authz";

function expectForbidden(fn: () => unknown, code = "FORBIDDEN") {
  try {
    fn();
  } catch (error) {
    expect(isApiError(error)).toBe(true);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).code).toBe(code);
    return;
  }
  throw new Error("Expected the assertion to throw an ApiError");
}

describe("authz predicates", () => {
  it("classifies roles correctly", () => {
    expect(isAdminRole(Role.ADMIN)).toBe(true);
    expect(isAdminRole(Role.USER)).toBe(false);
    expect(isAdminRole(null)).toBe(false);

    expect(isProviderRole(Role.THERAPIST)).toBe(true);
    expect(isProviderRole(Role.LISTENER)).toBe(true);
    expect(isProviderRole(Role.USER)).toBe(false);
    expect(isProviderRole(Role.ADMIN)).toBe(false);

    expect(isProviderOrAdmin(Role.THERAPIST)).toBe(true);
    expect(isProviderOrAdmin(Role.ADMIN)).toBe(true);
    expect(isProviderOrAdmin(Role.USER)).toBe(false);
  });
});

describe("authz role assertions", () => {
  it("assertRole rejects roles outside the allowlist", () => {
    expectForbidden(() => assertRole(Role.USER, [Role.ADMIN]));
    expect(() => assertRole(Role.ADMIN, [Role.ADMIN])).not.toThrow();
  });

  it("assertAdmin only allows ADMIN", () => {
    expect(() => assertAdmin(Role.ADMIN)).not.toThrow();
    expectForbidden(() => assertAdmin(Role.THERAPIST));
  });

  it("assertProviderAccess allows providers and admins", () => {
    expect(() => assertProviderAccess(Role.THERAPIST)).not.toThrow();
    expect(() => assertProviderAccess(Role.LISTENER)).not.toThrow();
    expect(() => assertProviderAccess(Role.ADMIN)).not.toThrow();
    expectForbidden(() => assertProviderAccess(Role.USER));
  });
});

describe("authz resource gates", () => {
  const resource = { userId: "user-1", providerId: "provider-1" };

  it("canAccessResource accepts admin, owner, and assigned provider", () => {
    expect(canAccessResource({ actorId: "admin", actorRole: Role.ADMIN }, resource)).toBe(true);
    expect(canAccessResource({ actorId: "user-1", actorRole: Role.USER }, resource)).toBe(true);
    expect(
      canAccessResource({ actorId: "provider-1", actorRole: Role.THERAPIST }, resource),
    ).toBe(true);
    expect(
      canAccessResource({ actorId: "stranger", actorRole: Role.USER }, resource),
    ).toBe(false);
  });

  it("assertResourceParticipant throws for unrelated actors", () => {
    expectForbidden(() =>
      assertResourceParticipant({ actorId: "stranger", actorRole: Role.USER }, resource),
    );
    expect(() =>
      assertResourceParticipant({ actorId: "user-1", actorRole: Role.USER }, resource),
    ).not.toThrow();
  });

  it("assertResourceProvider only allows admin or the assigned provider", () => {
    expect(() =>
      assertResourceProvider(
        { actorId: "provider-1", actorRole: Role.THERAPIST },
        { providerId: "provider-1" },
      ),
    ).not.toThrow();
    expect(() =>
      assertResourceProvider(
        { actorId: "admin", actorRole: Role.ADMIN },
        { providerId: "provider-1" },
      ),
    ).not.toThrow();
    expectForbidden(() =>
      assertResourceProvider(
        { actorId: "user-1", actorRole: Role.USER },
        { providerId: "provider-1" },
      ),
    );
  });
});

describe("authz scope helpers", () => {
  it("defaults bookings to all for admin and requester/provider otherwise", () => {
    expect(defaultBookingScope(Role.ADMIN)).toBe("all");
    expect(defaultBookingScope(Role.USER)).toBe("requester");
    expect(defaultBookingScope(Role.THERAPIST)).toBe("provider");
  });

  it("defaults sessions to all for admin, provider for providers, participant for members", () => {
    expect(defaultSessionScope(Role.ADMIN)).toBe("all");
    expect(defaultSessionScope(Role.LISTENER)).toBe("provider");
    expect(defaultSessionScope(Role.THERAPIST)).toBe("provider");
    expect(defaultSessionScope(Role.USER)).toBe("participant");
  });

  it("assertBookingScope blocks non-admin all scope and user provider scope", () => {
    expect(() => assertBookingScope(Role.ADMIN, "all")).not.toThrow();
    expect(() => assertBookingScope(Role.THERAPIST, "provider")).not.toThrow();
    expect(() => assertBookingScope(Role.USER, "requester")).not.toThrow();
    expectForbidden(() => assertBookingScope(Role.USER, "all"), "FORBIDDEN_SCOPE");
    expectForbidden(() => assertBookingScope(Role.USER, "provider"), "FORBIDDEN_SCOPE");
  });

  it("assertSessionScope mirrors booking scope rules", () => {
    expect(() => assertSessionScope(Role.ADMIN, "all")).not.toThrow();
    expect(() => assertSessionScope(Role.LISTENER, "provider")).not.toThrow();
    expectForbidden(() => assertSessionScope(Role.LISTENER, "both"), "FORBIDDEN_SCOPE");
    expectForbidden(() => assertSessionScope(Role.THERAPIST, "both"), "FORBIDDEN_SCOPE");
    expect(() => assertSessionScope(Role.USER, "participant")).not.toThrow();
    expectForbidden(() => assertSessionScope(Role.USER, "all"), "FORBIDDEN_SCOPE");
    expectForbidden(() => assertSessionScope(Role.USER, "provider"), "FORBIDDEN_SCOPE");
    expectForbidden(() => assertSessionScope(Role.USER, "both"), "FORBIDDEN_SCOPE");
  });
});
