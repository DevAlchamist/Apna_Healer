import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careSession: { findUnique: vi.fn() },
  },
}));

import { getReminderWindow } from "@/server/services/session-reminder-windows";
import { buildWelcomeSubject, renderWelcomeEmail } from "@/server/emails/templates/welcome";
import { renderPaymentConfirmationEmail } from "@/server/emails/templates/payment-confirmation";
import {
  renderNotificationEmail,
  shouldSendEmailForType,
} from "@/server/emails/render-notification-email";

describe("session-reminder-service", () => {
  it("targets sessions starting in ~24 hours", () => {
    const now = Date.parse("2026-06-01T12:00:00.000Z");
    const window = getReminderWindow("24h", now);
    expect(window.startGte.toISOString()).toBe("2026-06-02T11:45:00.000Z");
    expect(window.startLt.toISOString()).toBe("2026-06-02T12:15:00.000Z");
  });

  it("targets sessions starting in ~1 hour", () => {
    const now = Date.parse("2026-06-01T12:00:00.000Z");
    const window = getReminderWindow("1h", now);
    expect(window.startGte.toISOString()).toBe("2026-06-01T12:55:00.000Z");
    expect(window.startLt.toISOString()).toBe("2026-06-01T13:05:00.000Z");
  });
});

describe("email templates", () => {
  it("renders welcome email with Apna Healer branding and CTAs", () => {
    const html = renderWelcomeEmail({
      userName: "Alex",
      isWelcomeBack: false,
      writeBlogUrl: "/dashboard/blog",
      bookSessionUrl: "/dashboard",
      exploreClubsUrl: "/clubs",
    });
    expect(html).toContain("Apna Healer");
    expect(html).toContain("Welcome to Apna Healer, Alex");
    expect(html).toContain("Write a blog");
    expect(html).toContain("Book a session");
    expect(html).toContain("Explore clubs");
  });

  it("builds welcome-back subject line", () => {
    expect(buildWelcomeSubject(true, "Alex")).toBe("Alex, welcome back to Apna Healer");
  });

  it("renders payment confirmation with amount", () => {
    const html = renderPaymentConfirmationEmail({
      userName: "Alex",
      isCredit: true,
      amount: "₹500",
      purpose: "Wallet top-up",
      walletUrl: "/dashboard/wallet",
    });
    expect(html).toContain("Payment received");
    expect(html).toContain("₹500");
    expect(html).toContain("Wallet top-up");
  });
});

describe("render-notification-email", () => {
  it("renders welcome notification without DB lookup", async () => {
    const rendered = await renderNotificationEmail("WELCOME", {
      userName: "Alex",
      userEmail: "alex@example.com",
      title: "Welcome",
      body: "Hello",
      href: "/dashboard",
      metadata: null,
    });
    expect(rendered.subject).toContain("Alex");
    expect(rendered.html).toContain("Apna Healer");
  });

  it("marks wallet and lifecycle types as email eligible", () => {
    expect(shouldSendEmailForType("WELCOME")).toBe(true);
    expect(shouldSendEmailForType("SESSION_REMINDER_24H")).toBe(true);
    expect(shouldSendEmailForType("WALLET_CREDIT")).toBe(true);
    expect(shouldSendEmailForType("JOURNAL_REMINDER")).toBe(false);
  });
});
