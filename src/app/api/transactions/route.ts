import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { transactionQuerySchema } from "@/lib/validators/wallet";
import { listUserTransactions } from "@/server/services/transaction-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    const filters = transactionQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const transactions = await listUserTransactions(sessionUser.id, filters);
    return ok(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}
