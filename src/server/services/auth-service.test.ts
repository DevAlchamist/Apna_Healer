import { Prisma, Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, grantWelcomeBonusIfNeededMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wallet: {
      create: vi.fn(),
    },
  },
  grantWelcomeBonusIfNeededMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/services/welcome-bonus-service", () => ({
  grantWelcomeBonusIfNeeded: grantWelcomeBonusIfNeededMock,
}));

import {
  ensureUserBootstrap,
  shouldPromoteToAdmin,
} from "@/server/services/auth-service";

function buildWallet(id: string) {
  return {
    id,
    userId: "user_unknown",
    availableBalance: new Prisma.Decimal(0),
    heldBalance: new Prisma.Decimal(0),
    totalSpent: new Prisma.Decimal(0),
    totalReceived: new Prisma.Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("auth service first-login bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grantWelcomeBonusIfNeededMock.mockResolvedValue({ granted: false });
  });

  it("returns existing identity when the wallet is already linked", async () => {
    const wallet = buildWallet("wallet_1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "user1@example.com",
      role: Role.USER,
      walletId: "wallet_1",
      wallet,
    });

    const result = await ensureUserBootstrap("user_1");

    expect(result).toEqual({
      id: "user_1",
      role: Role.USER,
      walletId: "wallet_1",
    });
    expect(prismaMock.wallet.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(grantWelcomeBonusIfNeededMock).toHaveBeenCalledWith({
      userId: "user_1",
      wallet,
    });
  });

  it("creates a wallet on first login and grants the welcome bonus", async () => {
    const newWallet = buildWallet("wallet_new");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_2",
      email: "user2@example.com",
      role: Role.USER,
      walletId: null,
      wallet: null,
    });
    prismaMock.wallet.create.mockResolvedValue(newWallet);
    prismaMock.user.update.mockResolvedValue({ id: "user_2", walletId: "wallet_new" });

    const result = await ensureUserBootstrap("user_2");

    expect(prismaMock.wallet.create).toHaveBeenCalledWith({
      data: { userId: "user_2" },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: { walletId: "wallet_new" },
    });
    expect(grantWelcomeBonusIfNeededMock).toHaveBeenCalledWith({
      userId: "user_2",
      wallet: newWallet,
    });
    expect(result).toEqual({
      id: "user_2",
      role: Role.USER,
      walletId: "wallet_new",
    });
  });

  it("relinks an orphan wallet without creating a duplicate", async () => {
    const orphanWallet = buildWallet("wallet_existing");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_3",
      email: "therapist@example.com",
      role: Role.THERAPIST,
      walletId: null,
      wallet: orphanWallet,
    });
    prismaMock.user.update.mockResolvedValue({ id: "user_3", walletId: "wallet_existing" });

    const result = await ensureUserBootstrap("user_3");

    expect(prismaMock.wallet.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_3" },
      data: { walletId: "wallet_existing" },
    });
    expect(grantWelcomeBonusIfNeededMock).toHaveBeenCalledWith({
      userId: "user_3",
      wallet: orphanWallet,
    });
    expect(result).toEqual({
      id: "user_3",
      role: Role.THERAPIST,
      walletId: "wallet_existing",
    });
  });

  it("throws a 404 when the authenticated user is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(ensureUserBootstrap("ghost_user")).rejects.toMatchObject({
      status: 404,
      code: "USER_NOT_FOUND",
    });
    expect(prismaMock.wallet.create).not.toHaveBeenCalled();
    expect(grantWelcomeBonusIfNeededMock).not.toHaveBeenCalled();
  });

  it("promotes a user to ADMIN when their email matches ADMIN_EMAILS", async () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "Owner@Example.com, other@example.com";
    try {
      const wallet = buildWallet("wallet_admin");
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user_admin",
        email: "owner@example.com",
        role: Role.USER,
        walletId: "wallet_admin",
        wallet,
      });
      prismaMock.user.update.mockResolvedValue({
        id: "user_admin",
        role: Role.ADMIN,
      });

      const result = await ensureUserBootstrap("user_admin");

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user_admin" },
        data: { role: Role.ADMIN },
      });
      expect(result).toEqual({
        id: "user_admin",
        role: Role.ADMIN,
        walletId: "wallet_admin",
      });
    } finally {
      if (original === undefined) {
        delete process.env.ADMIN_EMAILS;
      } else {
        process.env.ADMIN_EMAILS = original;
      }
    }
  });

  it("does not change role when email is not in ADMIN_EMAILS", async () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "owner@example.com";
    try {
      const wallet = buildWallet("wallet_x");
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user_x",
        email: "someoneelse@example.com",
        role: Role.USER,
        walletId: "wallet_x",
        wallet,
      });

      const result = await ensureUserBootstrap("user_x");

      expect(prismaMock.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: Role.ADMIN } }),
      );
      expect(result.role).toBe(Role.USER);
    } finally {
      if (original === undefined) {
        delete process.env.ADMIN_EMAILS;
      } else {
        process.env.ADMIN_EMAILS = original;
      }
    }
  });
});

describe("shouldPromoteToAdmin", () => {
  it("returns true when email is in the allowlist (case-insensitive)", () => {
    expect(
      shouldPromoteToAdmin("Foo@Bar.com", Role.USER, "foo@bar.com,baz@qux.io"),
    ).toBe(true);
    expect(
      shouldPromoteToAdmin("BAZ@qux.io", Role.THERAPIST, "foo@bar.com,baz@qux.io"),
    ).toBe(true);
  });

  it("returns false when already an admin, missing email, or no allowlist", () => {
    expect(shouldPromoteToAdmin("foo@bar.com", Role.ADMIN, "foo@bar.com")).toBe(false);
    expect(shouldPromoteToAdmin(null, Role.USER, "foo@bar.com")).toBe(false);
    expect(shouldPromoteToAdmin("foo@bar.com", Role.USER, undefined)).toBe(false);
    expect(shouldPromoteToAdmin("foo@bar.com", Role.USER, "")).toBe(false);
  });

  it("returns false when the email is not present in the allowlist", () => {
    expect(
      shouldPromoteToAdmin("other@bar.com", Role.USER, "foo@bar.com,baz@qux.io"),
    ).toBe(false);
  });
});
