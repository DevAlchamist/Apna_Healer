import { Role, Prisma } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    const purchases = await prisma.packagePurchase.findMany({
      where: packageId ? { packageId } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, title: true } },
        allocations: true,
      },
      orderBy: { purchaseDate: "desc" },
    });

    return ok(purchases);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const body = await request.json();
    const { id, status, allocations } = body;

    if (!id) {
      return handleApiError(new Error("Purchase ID is required."));
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.packagePurchase.update({
        where: { id },
        data: { status },
      });

      if (allocations && Array.isArray(allocations)) {
        for (const alloc of allocations) {
          // Find allocation first to determine allocatedSessions
          const existingAlloc = await tx.packagePurchaseAllocation.findFirst({
            where: { purchaseId: id, role: alloc.role },
          });

          if (existingAlloc) {
            const remaining = Math.max(0, Number(alloc.remainingSessions));
            const used = Math.max(0, existingAlloc.allocatedSessions - remaining);
            await tx.packagePurchaseAllocation.update({
              where: { id: existingAlloc.id },
              data: {
                remainingSessions: remaining,
                usedSessions: used,
              },
            });
          }
        }
      }

      return tx.packagePurchase.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { id: true, title: true } },
          allocations: true,
        },
      });
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
