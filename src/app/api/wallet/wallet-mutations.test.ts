import { ApiError } from "@/lib/api-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSessionUserMock,
  addMoneyToWalletMock,
  withdrawFromWalletMock,
} = vi.hoisted(() => ({
  requireSessionUserMock: vi.fn(),
  addMoneyToWalletMock: vi.fn(),
  withdrawFromWalletMock: vi.fn(),
}));

vi.mock("@/lib/session-auth", () => ({
  requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/server/services/wallet-service", () => ({
  addMoneyToWallet: addMoneyToWalletMock,
  withdrawFromWallet: withdrawFromWalletMock,
}));

import { POST as addMoneyPost } from "@/app/api/wallet/add-money/route";
import { POST as withdrawPost } from "@/app/api/wallet/withdraw/route";

describe("wallet mutation route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds money for the authenticated user", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });
    addMoneyToWalletMock.mockResolvedValue({
      wallet: { id: "wallet_1" },
      transaction: { id: "txn_credit" },
    });

    const response = await addMoneyPost(
      new Request("http://localhost/api/wallet/add-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 250,
        }),
      }),
    );

    expect(addMoneyToWalletMock).toHaveBeenCalledWith("user_1", 250);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        wallet: { id: "wallet_1" },
        transaction: { id: "txn_credit" },
      },
    });
  });

  it("withdraws money for the authenticated user", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });
    withdrawFromWalletMock.mockResolvedValue({
      wallet: { id: "wallet_1" },
      transaction: { id: "txn_debit" },
    });

    const response = await withdrawPost(
      new Request("http://localhost/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 75.5,
        }),
      }),
    );

    expect(withdrawFromWalletMock).toHaveBeenCalledWith("user_1", 75.5);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        wallet: { id: "wallet_1" },
        transaction: { id: "txn_debit" },
      },
    });
  });

  it("returns validation errors for malformed wallet amounts", async () => {
    requireSessionUserMock.mockResolvedValue({
      id: "user_1",
      role: "USER",
    });

    const response = await addMoneyPost(
      new Request("http://localhost/api/wallet/add-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 250.999,
        }),
      }),
    );

    expect(addMoneyToWalletMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("maps auth/service errors through the shared handler response shape", async () => {
    requireSessionUserMock.mockRejectedValue(
      new ApiError(401, "Authentication required.", "UNAUTHORIZED"),
    );

    const response = await withdrawPost(
      new Request("http://localhost/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 25,
        }),
      }),
    );

    expect(withdrawFromWalletMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    });
  });
});
