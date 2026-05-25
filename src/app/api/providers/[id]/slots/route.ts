import type { NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getProviderSlotsForDate } from "@/server/services/provider-service";

const querySchema = z.object({
  date: z.string().datetime(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { id } = await params;
    const { date } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await getProviderSlotsForDate({
      providerId: id,
      date: new Date(date),
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
