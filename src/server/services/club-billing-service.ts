import {
  ClubBillingAttemptStatus,
  ClubMembershipStatus,
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  addOneMonth,
  decimalToString,
  MAX_BILLING_FAIL_COUNT,
} from "@/server/services/club-utils";
import { createTransactionRecord } from "@/server/services/transaction-service";
import { toDecimal } from "@/server/services/service-utils";
import {
  emitClubMemberPaymentOverdue,
  emitClubSubscriptionCharged,
  emitClubSubscriptionFailed,
} from "@/server/services/platform-events";
import { incrementMemberCount } from "@/server/services/club-service";

export async function chargeMembershipSubscription(membershipId: string) {
  const membership = await prisma.clubMembership.findUnique({
    where: { id: membershipId },
    include: {
      club: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!membership) {
    throw new ApiError(404, "Membership not found.", "MEMBERSHIP_NOT_FOUND");
  }

  if (
    membership.status === ClubMembershipStatus.LEFT ||
    membership.status === ClubMembershipStatus.SUSPENDED
  ) {
    return { skipped: true as const, reason: "inactive" };
  }

  const amount = membership.club.monthlyFee;
  const userId = membership.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new ApiError(404, "Wallet was not found.", "WALLET_NOT_FOUND");
      }

      if (wallet.availableBalance.lessThan(amount)) {
        throw new ApiError(400, "Insufficient wallet balance.", "INSUFFICIENT_FUNDS");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: wallet.availableBalance.minus(amount),
          totalSpent: wallet.totalSpent.plus(amount),
        },
      });

      const transaction = await createTransactionRecord(tx, {
        walletId: wallet.id,
        userId,
        type: TransactionType.DEBIT,
        amount,
        status: TransactionStatus.SUCCESS,
        purpose: "CLUB_SUBSCRIPTION",
        referenceId: membership.id,
        metadata: {
          clubId: membership.clubId,
          clubTitle: membership.club.title,
        },
      });

      const now = new Date();
      const updatedMembership = await tx.clubMembership.update({
        where: { id: membershipId },
        data: {
          status: ClubMembershipStatus.ACTIVE,
          lastPaidAt: now,
          nextBillingAt: addOneMonth(now),
          lastTransactionId: transaction.id,
          billingFailCount: 0,
        },
      });

      await tx.clubBillingAttempt.create({
        data: {
          membershipId,
          amount,
          status: ClubBillingAttemptStatus.SUCCESS,
          transactionId: transaction.id,
        },
      });

      return { transaction, updatedMembership, updatedWallet };
    });

    void emitClubSubscriptionCharged({
      userId,
      clubId: membership.clubId,
      clubTitle: membership.club.title,
      amount: decimalToString(amount),
      membershipId,
    }).catch(console.error);

    return { success: true as const, ...result };
  } catch (err) {
    const reason =
      err instanceof ApiError && err.code === "INSUFFICIENT_FUNDS"
        ? "INSUFFICIENT_FUNDS"
        : "CHARGE_FAILED";

    const failCount = membership.billingFailCount + 1;
    const newStatus =
      failCount >= MAX_BILLING_FAIL_COUNT
        ? ClubMembershipStatus.SUSPENDED
        : ClubMembershipStatus.PAST_DUE;

    await prisma.$transaction(async (tx) => {
      await tx.clubMembership.update({
        where: { id: membershipId },
        data: {
          status: newStatus,
          billingFailCount: failCount,
        },
      });
      await tx.clubBillingAttempt.create({
        data: {
          membershipId,
          amount,
          status: ClubBillingAttemptStatus.FAILED,
          failureReason: reason,
        },
      });
    });

    void emitClubSubscriptionFailed({
      userId,
      clubId: membership.clubId,
      clubTitle: membership.club.title,
      amount: decimalToString(amount),
      membershipId,
    }).catch(console.error);

    if (membership.club.ownerUserId) {
      void emitClubMemberPaymentOverdue({
        ownerUserId: membership.club.ownerUserId,
        memberUserId: userId,
        memberLabel: membership.user.name ?? membership.user.email,
        clubId: membership.clubId,
        clubTitle: membership.club.title,
        membershipId,
      }).catch(console.error);
    }

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
      take: 5,
    });
    for (const admin of admins) {
      void emitClubMemberPaymentOverdue({
        ownerUserId: admin.id,
        memberUserId: userId,
        memberLabel: membership.user.name ?? membership.user.email,
        clubId: membership.clubId,
        clubTitle: membership.club.title,
        membershipId,
        forAdmin: true,
      }).catch(console.error);
    }

    return { success: false as const, reason, failCount, status: newStatus };
  }
}

export async function activateMembershipWithBilling(membershipId: string) {
  const charge = await chargeMembershipSubscription(membershipId);
  if (!charge.success && "reason" in charge && charge.reason === "INSUFFICIENT_FUNDS") {
    throw new ApiError(
      400,
      "Insufficient wallet balance to join this club. Please top up your wallet.",
      "INSUFFICIENT_FUNDS",
    );
  }
  return charge;
}

export async function createMembershipForUser(input: {
  clubId: string;
  userId: string;
  role?: "OWNER" | "MODERATOR" | "MEMBER";
  skipBilling?: boolean;
}) {
  const club = await prisma.club.findUniqueOrThrow({ where: { id: input.clubId } });

  const existing = await prisma.clubMembership.findUnique({
    where: { clubId_userId: { clubId: input.clubId, userId: input.userId } },
  });

  if (existing && existing.status !== ClubMembershipStatus.LEFT) {
    throw new ApiError(409, "User is already a member.", "ALREADY_MEMBER");
  }

  const membership = await prisma.clubMembership.upsert({
    where: { clubId_userId: { clubId: input.clubId, userId: input.userId } },
    create: {
      clubId: input.clubId,
      userId: input.userId,
      role: input.role ?? "MEMBER",
      status: ClubMembershipStatus.ACTIVE,
      joinedAt: new Date(),
      nextBillingAt: new Date(),
    },
    update: {
      role: input.role ?? "MEMBER",
      status: ClubMembershipStatus.ACTIVE,
      joinedAt: new Date(),
      billingFailCount: 0,
      nextBillingAt: new Date(),
    },
  });

  if (!input.skipBilling) {
    await activateMembershipWithBilling(membership.id);
  } else {
    await prisma.clubMembership.update({
      where: { id: membership.id },
      data: {
        nextBillingAt: addOneMonth(new Date()),
        lastPaidAt: new Date(),
      },
    });
  }

  if (!existing || existing.status === ClubMembershipStatus.LEFT) {
    await incrementMemberCount(input.clubId, 1);
  }

  return prisma.clubMembership.findUniqueOrThrow({
    where: { id: membership.id },
    include: { club: true },
  });
}

export async function processDueClubBilling() {
  const now = new Date();
  const due = await prisma.clubMembership.findMany({
    where: {
      status: { in: [ClubMembershipStatus.ACTIVE, ClubMembershipStatus.PAST_DUE] },
      nextBillingAt: { lte: now },
    },
    take: 200,
  });

  let charged = 0;
  let failed = 0;
  let skipped = 0;

  for (const m of due) {
    const result = await chargeMembershipSubscription(m.id);
    if ("skipped" in result && result.skipped) {
      skipped += 1;
    } else if (result.success) {
      charged += 1;
    } else {
      failed += 1;
    }
  }

  return { checked: due.length, charged, failed, skipped };
}
