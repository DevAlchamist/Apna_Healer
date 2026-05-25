import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  sanitizeAdminUserUpdateDetails,
  sanitizeApplicationReviewDetails,
  sanitizeStatusChangeDetails,
  sanitizeWalletTransactionDetails,
} from "@/server/services/audit-log-sanitizers";

describe("audit-log-sanitizers", () => {
  const baseUser = {
    role: Role.USER,
    isVerified: false,
    name: "Test User",
    email: "test@example.com",
    phone: null,
    city: null,
    timezone: "Asia/Kolkata",
    primaryFocus: null,
    interestTags: [] as string[],
    therapistProfile: null,
    listenerProfile: null,
  };

  it("records only changed scalar fields for admin user patch", () => {
    const before = { ...baseUser, role: Role.USER };
    const after = { ...baseUser, role: Role.THERAPIST, isVerified: true };
    const details = sanitizeAdminUserUpdateDetails(before, after, {
      role: "THERAPIST",
      isVerified: true,
    });

    expect(details.changes).toEqual({
      role: { from: Role.USER, to: Role.THERAPIST },
      isVerified: { from: false, to: true },
    });
    expect(details.touchedFields).toEqual(["role", "isVerified"]);
  });

  it("stores provider profile counts not full arrays", () => {
    const before = {
      ...baseUser,
      therapistProfile: {
        hourlyRate: { toString: () => "1000" } as { toString(): string },
        experienceYears: 2,
        specializations: ["CBT", "Trauma"],
        certifications: ["MSc"],
      },
    };
    const after = {
      ...before,
      therapistProfile: {
        hourlyRate: { toString: () => "2000" } as { toString(): string },
        experienceYears: 3,
        specializations: ["CBT", "Trauma", "Mindfulness"],
        certifications: ["MSc", "PhD"],
      },
    };

    const details = sanitizeAdminUserUpdateDetails(before, after, {
      therapistProfile: {
        bio: "Bio",
        specialization: "CBT",
        certifications: ["MSc"],
        experienceYears: 3,
        hourlyRate: 2000,
        weeklyAvailability: [],
      },
    });

    const changes = details.changes as {
      therapistProfile?: { from: unknown; to: unknown };
    };
    expect(changes.therapistProfile?.from).toEqual({
      hourlyRate: "1000",
      experienceYears: 2,
      specializationsCount: 2,
      certificationsCount: 1,
    });
    expect(changes.therapistProfile?.to).toEqual({
      hourlyRate: "2000",
      experienceYears: 3,
      specializationsCount: 3,
      certificationsCount: 2,
    });
  });

  it("truncates long admin notes on application review", () => {
    const longNote = "x".repeat(300);
    const details = sanitizeApplicationReviewDetails({
      applicationId: "app1",
      type: "THERAPIST",
      status: "APPROVED",
      reviewedBy: "admin1",
      adminNote: longNote,
    });

    const note = details.adminNote as string;
    expect(note.length).toBeLessThanOrEqual(201);
    expect(note.endsWith("…")).toBe(true);
  });

  it("sanitizes status change without extra payloads", () => {
    const details = sanitizeStatusChangeDetails({
      id: "b1",
      fromStatus: "PENDING",
      toStatus: "ACCEPTED",
      actorId: "u1",
      bookingId: "bk1",
    });

    expect(details).toEqual({
      id: "b1",
      fromStatus: "PENDING",
      toStatus: "ACCEPTED",
      actorId: "u1",
      bookingId: "bk1",
    });
  });

  it("sanitizes wallet transaction with minimal fields", () => {
    const details = sanitizeWalletTransactionDetails({
      transactionId: "tx1",
      type: "CREDIT",
      amount: "500",
      userId: "u1",
      purpose: "WALLET_TOP_UP",
    });

    expect(details).toEqual({
      transactionId: "tx1",
      type: "CREDIT",
      amount: "500",
      userId: "u1",
      purpose: "WALLET_TOP_UP",
    });
    expect(Object.keys(details)).toHaveLength(5);
  });
});
