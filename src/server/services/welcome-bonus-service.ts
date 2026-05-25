import {
  Prisma,
  TransactionStatus,
  TransactionType,
  type Wallet,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { toDecimal } from "@/server/services/service-utils";

/**
 * Every newly registered user receives this one-time joining credit.
 * It is implemented as a CREDIT transaction with purpose WELCOME_BONUS so the
 * ledger remains the source of truth (no schema migration required).
 */
export const WELCOME_BONUS_AMOUNT = 100;
export const WELCOME_BONUS_PURPOSE = "WELCOME_BONUS";

type WelcomeBonusMetadata = { claimed?: boolean; claimedAt?: string };

function isClaimedMetadata(metadata: Prisma.JsonValue): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  return (metadata as WelcomeBonusMetadata).claimed === true;
}

async function findWelcomeBonusTransaction(userId: string) {
  return prisma.transaction.findFirst({
    where: {
      userId,
      type: TransactionType.CREDIT,
      purpose: WELCOME_BONUS_PURPOSE,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Grants the welcome bonus exactly once per user. If a CREDIT transaction
 * with purpose WELCOME_BONUS already exists, this is a no-op.
 *
 * Runs inside a single Prisma transaction so the wallet balance and the
 * ledger entry stay consistent.
 */
export async function grantWelcomeBonusIfNeeded(input: {
  userId: string;
  wallet: Wallet;
}) {
  const existing = await findWelcomeBonusTransaction(input.userId);
  if (existing) {
    return { granted: false, transactionId: existing.id };
  }

  const decimalAmount = toDecimal(WELCOME_BONUS_AMOUNT);

  return prisma.$transaction(async (tx) => {
    // Re-check inside the transaction to avoid races on concurrent first logins.
    const raceCheck = await tx.transaction.findFirst({
      where: {
        userId: input.userId,
        type: TransactionType.CREDIT,
        purpose: WELCOME_BONUS_PURPOSE,
      },
      select: { id: true },
    });

    if (raceCheck) {
      return { granted: false, transactionId: raceCheck.id };
    }

    await tx.wallet.update({
      where: { id: input.wallet.id },
      data: {
        availableBalance: input.wallet.availableBalance.plus(decimalAmount),
        totalReceived: input.wallet.totalReceived.plus(decimalAmount),
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: input.wallet.id,
        userId: input.userId,
        type: TransactionType.CREDIT,
        amount: decimalAmount,
        status: TransactionStatus.SUCCESS,
        purpose: WELCOME_BONUS_PURPOSE,
        metadata: { claimed: false } satisfies WelcomeBonusMetadata,
      },
      select: { id: true },
    });

    return { granted: true, transactionId: transaction.id };
  });
}

/**
 * True when the user has a WELCOME_BONUS credit on their ledger that has
 * not yet been marked as claimed by the celebratory modal.
 */
export async function getWelcomeBonusState(userId: string) {
  const transaction = await findWelcomeBonusTransaction(userId);
  if (!transaction) {
    return { available: false, amount: WELCOME_BONUS_AMOUNT, claimed: false };
  }

  return {
    available: !isClaimedMetadata(transaction.metadata),
    amount: Number(transaction.amount),
    claimed: isClaimedMetadata(transaction.metadata),
  };
}

/**
 * Marks the welcome bonus as claimed so the celebratory modal is shown only
 * once per user. The underlying credit stays on the ledger.
 */
export async function markWelcomeBonusClaimed(userId: string) {
  const transaction = await findWelcomeBonusTransaction(userId);

  if (!transaction) {
    throw new ApiError(
      404,
      "No welcome bonus is available to claim.",
      "WELCOME_BONUS_NOT_FOUND",
    );
  }

  if (isClaimedMetadata(transaction.metadata)) {
    return { alreadyClaimed: true };
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      metadata: {
        claimed: true,
        claimedAt: new Date().toISOString(),
      } satisfies WelcomeBonusMetadata,
    },
  });

  return { alreadyClaimed: false };
}
