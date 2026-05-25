import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listPayoutTransactions } from "@/server/services/transaction-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const takeParam = request.nextUrl.searchParams.get("take");
    const take = takeParam ? Number(takeParam) : 50;
    const payouts = await listPayoutTransactions(Number.isFinite(take) ? take : 50);
    return ok(payouts);
  } catch (error) {
    return handleApiError(error);
  }
}
