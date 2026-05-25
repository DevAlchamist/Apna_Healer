import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/server/services/email-service", () => ({
  isEmailEligibleType: () => false,
  sendNotificationEmail: vi.fn(),
  buildNotificationEmailHtml: vi.fn(),
}));

import { getUnreadCount } from "@/server/services/notification-service";

describe("notification-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unread notification count for user", async () => {
    mockPrisma.notification.count.mockResolvedValue(3);

    const count = await getUnreadCount("user-1");

    expect(count).toBe(3);
    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: { userId: "user-1", readAt: null },
    });
  });
});
