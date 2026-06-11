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

const mockRenderNotificationEmail = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/server/emails/render-notification-email", () => ({
  renderNotificationEmail: mockRenderNotificationEmail,
  shouldSendEmailForType: (type: string) => type === "WELCOME",
}));

vi.mock("@/server/services/email-service", () => ({
  isEmailEligibleType: (type: string) => type === "WELCOME",
  sendEmail: mockSendEmail,
}));

import { createNotification, getUnreadCount } from "@/server/services/notification-service";

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

  it("routes eligible notifications through the email registry", async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: "n1",
      userId: "user-1",
      type: "WELCOME",
      title: "Welcome",
      body: "Hello",
      href: "/dashboard",
      metadata: null,
      readAt: null,
      emailSentAt: null,
      createdAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ email: "alex@example.com", name: "Alex" });
    mockRenderNotificationEmail.mockResolvedValue({
      subject: "Welcome Alex",
      html: "<p>Welcome</p>",
    });
    mockSendEmail.mockResolvedValue(true);
    mockPrisma.notification.findUniqueOrThrow.mockResolvedValue({
      id: "n1",
      userId: "user-1",
      type: "WELCOME",
      title: "Welcome",
      body: "Hello",
      href: "/dashboard",
      metadata: null,
      readAt: null,
      emailSentAt: new Date(),
      createdAt: new Date(),
    });

    await createNotification({
      userId: "user-1",
      type: "WELCOME",
      title: "Welcome",
      body: "Hello",
      href: "/dashboard",
    });

    expect(mockRenderNotificationEmail).toHaveBeenCalledWith(
      "WELCOME",
      expect.objectContaining({ userEmail: "alex@example.com" }),
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        subject: "Welcome Alex",
        html: "<p>Welcome</p>",
      }),
    );
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { emailSentAt: expect.any(Date) },
    });
  });
});
