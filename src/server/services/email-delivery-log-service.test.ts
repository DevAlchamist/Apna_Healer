import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  emailDeliveryLog: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  hasEmailBeenSent,
  recordEmailDelivery,
} from "@/server/services/email-delivery-log-service";

describe("email-delivery-log-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when dedupe record exists", async () => {
    mockPrisma.emailDeliveryLog.findUnique.mockResolvedValue({ id: "log-1" });
    await expect(hasEmailBeenSent("SESSION_REMINDER_24H", "session-1:24h")).resolves.toBe(true);
  });

  it("returns false when dedupe record is missing", async () => {
    mockPrisma.emailDeliveryLog.findUnique.mockResolvedValue(null);
    await expect(hasEmailBeenSent("SESSION_REMINDER_24H", "session-1:24h")).resolves.toBe(false);
  });

  it("swallows unique constraint errors on record", async () => {
    mockPrisma.emailDeliveryLog.create.mockRejectedValue(new Error("Unique constraint failed"));
    await expect(
      recordEmailDelivery({ userId: "u1", kind: "MONTHLY_RECAP", dedupeKey: "u1:2026-05" }),
    ).resolves.toBeUndefined();
  });
});
