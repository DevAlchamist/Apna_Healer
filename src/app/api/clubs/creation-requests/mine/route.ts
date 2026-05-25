import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { listMyClubCreationRequests } from "@/server/services/club-creation-request-service";
import { decimalToString } from "@/server/services/club-utils";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET() {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const rows = await listMyClubCreationRequests(user.id);
    return ok(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        status: r.status,
        title: r.title,
        subtitle: r.subtitle,
        monthlyFee: decimalToString(r.monthlyFee),
        createdAt: r.createdAt.toISOString(),
        createdClubId: r.createdClubId,
        adminNote: r.adminNote,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
