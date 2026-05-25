import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { serializeListenerBookingRequest } from "@/lib/listener-request-serialize";

describe("serializeListenerBookingRequest", () => {
  const base = {
    id: "r1",
    userId: "u1",
    preferredDate: new Date(),
    preferredTime: "19:00",
    duration: 30,
    emotionalTags: [] as string[],
    preferredTone: null,
    preferredLanguage: null,
    note: null,
    assignedListenerId: "l1",
    status: "ASSIGNED" as const,
    listenerConfirmation: "PENDING" as const,
    amountHeld: 50 as unknown as never,
    holdTransactionId: null,
    captureTransactionId: null,
    releaseTransactionId: null,
    metadata: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedListener: { id: "l1", name: "Secret" },
    session: null,
  } as Parameters<typeof serializeListenerBookingRequest>[0];

  it("hides listener for the requester until session is completed", () => {
    const out = serializeListenerBookingRequest(base, { id: "u1", role: Role.USER });
    expect(out.assignedListenerId).toBeNull();
    expect(out.assignedListener).toBeNull();
    expect(out.listenerIdentityHidden).toBe(true);
  });

  it("reveals listener after session completed", () => {
    const out = serializeListenerBookingRequest(
      {
        ...base,
        session: { id: "s1", status: "COMPLETED" },
      },
      { id: "u1", role: Role.USER },
    );
    expect(out.assignedListenerId).toBe("l1");
    expect(out.listenerIdentityHidden).toBe(false);
  });

  it("never hides from admin", () => {
    const out = serializeListenerBookingRequest(base, { id: "admin", role: Role.ADMIN });
    expect(out.assignedListenerId).toBe("l1");
    expect(out.listenerIdentityHidden).toBe(false);
  });
});
