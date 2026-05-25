import type { NextRequest } from "next/server";
import { ClubStatus, Role } from "@prisma/client";
import { handleApiError, ok, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { createClubSchema } from "@/lib/validators/club";
import { createClub, listClubsAdmin, mapDetail } from "@/server/services/club-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(ClubStatus).includes(statusParam as ClubStatus)
        ? (statusParam as ClubStatus)
        : undefined;
    const clubs = await listClubsAdmin({ status });
    return ok(clubs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const body = createClubSchema.parse(await request.json());
    const club = await createClub(user.id, body, { asAdmin: true });
    return created(mapDetail(club));
  } catch (error) {
    return handleApiError(error);
  }
}
