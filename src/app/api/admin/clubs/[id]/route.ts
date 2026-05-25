import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { updateClubSchema } from "@/lib/validators/club";
import { getClubById, mapDetail, updateClub } from "@/server/services/club-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const club = await getClubById(id);
    return ok(mapDetail(club));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const body = updateClubSchema.parse(await request.json());
    const club = await updateClub(id, body);
    return ok(mapDetail(club));
  } catch (error) {
    return handleApiError(error);
  }
}
