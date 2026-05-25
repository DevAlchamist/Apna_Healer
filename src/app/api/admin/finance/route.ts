import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminFinanceQuerySchema } from "@/lib/validators/admin-finance";
import { getAdminFinanceDashboard } from "@/server/services/admin-finance-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const query = adminFinanceQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const data = await getAdminFinanceDashboard(query);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
