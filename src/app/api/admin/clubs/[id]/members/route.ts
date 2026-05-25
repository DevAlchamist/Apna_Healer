import { Role } from "@prisma/client";
import { handleApiError, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { assignClubMemberSchema } from "@/lib/validators/club";
import { createMembershipForUser } from "@/server/services/club-billing-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const { id: clubId } = await params;
    const body = assignClubMemberSchema.parse(await request.json());
    const membership = await createMembershipForUser({
      clubId,
      userId: body.userId,
      role: body.role,
      skipBilling: body.skipBilling,
    });
    return created({
      id: membership.id,
      clubId: membership.clubId,
      userId: membership.userId,
      status: membership.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
