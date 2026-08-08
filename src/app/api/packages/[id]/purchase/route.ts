import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, failure, created } from "@/lib/api-response";
import {
  BookingPaymentMethod,
  PackagePublicationStatus,
  PackagePurchaseStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { createTransactionRecord } from "@/server/services/transaction-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return failure(401, "Unauthorized. Authentication required.", "UNAUTHORIZED");
    }

    const { id } = await context.params;

    // Fetch user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    });

    if (!wallet) {
      return failure(404, "User wallet not found.", "WALLET_NOT_FOUND");
    }

    // Fetch package details
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        allocations: true
      }
    });

    if (!pkg) {
      return failure(404, "Package not found.", "NOT_FOUND");
    }

    // 1. Validate publication status
    if (pkg.publicationStatus !== PackagePublicationStatus.PUBLISHED) {
      return failure(400, "This package is not currently published.", "NOT_PUBLISHED");
    }

    // 2. Validate visibility
    if (!pkg.isVisible) {
      return failure(400, "This package is not currently visible.", "NOT_VISIBLE");
    }

    const now = new Date();

    // 3. Validate purchase window
    if (pkg.startDate && now < pkg.startDate) {
      return failure(400, "The purchase window for this package has not started yet.", "WINDOW_NOT_OPEN");
    }
    if (pkg.endDate && now > pkg.endDate) {
      return failure(400, "The purchase window for this package has expired.", "WINDOW_EXPIRED");
    }

    // 4. Validate quantity limits
    if (pkg.maxPurchases != null && pkg.purchaseCount >= pkg.maxPurchases) {
      return failure(400, "This package has sold out.", "SOLD_OUT");
    }

    // Calculate final discounted price
    // finalPrice = price - (price * (discount / 100))
    const pricePaid = pkg.price.minus(pkg.price.times(pkg.discount.dividedBy(100)));

    // 5. Validate sufficient wallet balance
    if (wallet.availableBalance.lessThan(pricePaid)) {
      return failure(
        400,
        "Insufficient wallet balance. Please deposit more funds before purchasing.",
        "INSUFFICIENT_FUNDS"
      );
    }

    // Calculate expiry dates
    const expiryDate = new Date();
    if (pkg.durationUnit === "DAY") {
      expiryDate.setDate(expiryDate.getDate() + pkg.durationValue);
    } else if (pkg.durationUnit === "WEEK") {
      expiryDate.setDate(expiryDate.getDate() + pkg.durationValue * 7);
    } else if (pkg.durationUnit === "MONTH") {
      expiryDate.setMonth(expiryDate.getMonth() + pkg.durationValue);
    } else if (pkg.durationUnit === "YEAR") {
      expiryDate.setFullYear(expiryDate.getFullYear() + pkg.durationValue);
    }

    // Execute transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create the purchase entry
      const newPurchase = await tx.packagePurchase.create({
        data: {
          userId: session.user.id,
          packageId: pkg.id,
          expiryDate,
          pricePaid,
          status: PackagePurchaseStatus.ACTIVE,
          packageSnapshot: {
            title: pkg.title,
            subtitle: pkg.subtitle,
            category: pkg.category,
            price: pkg.price.toString(),
            discount: pkg.discount.toString(),
            durationValue: pkg.durationValue,
            durationUnit: pkg.durationUnit,
            allocations: pkg.allocations.map((a: any) => ({ role: a.role, sessionCount: a.sessionCount })),
            sections: pkg.sections as any
          }
        }
      });

      // Create purchase allocations
      for (const allocation of pkg.allocations) {
        await tx.packagePurchaseAllocation.create({
          data: {
            purchaseId: newPurchase.id,
            role: allocation.role,
            allocatedSessions: allocation.sessionCount,
            remainingSessions: allocation.sessionCount,
            usedSessions: 0
          }
        });
      }

      // Deduct wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: wallet.availableBalance.minus(pricePaid),
          totalSpent: wallet.totalSpent.plus(pricePaid)
        }
      });

      // Create transaction log
      await createTransactionRecord(tx, {
        walletId: wallet.id,
        userId: session.user.id,
        type: TransactionType.SESSION_PAYMENT,
        amount: pricePaid,
        status: TransactionStatus.SUCCESS,
        purpose: "PACKAGE_PURCHASE",
        referenceId: newPurchase.id,
        metadata: {
          packageId: pkg.id,
          paymentMethod: BookingPaymentMethod.WALLET
        }
      });

      // Increment package purchase counter
      await tx.package.update({
        where: { id: pkg.id },
        data: {
          purchaseCount: { increment: 1 }
        }
      });

      return newPurchase;
    });

    return created(purchase);
  } catch (error) {
    return handleApiError(error);
  }
}
