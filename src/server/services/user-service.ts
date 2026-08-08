import { CareSessionStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { getWelcomeBonusState } from "@/server/services/welcome-bonus-service";
import type { AdminPatchUserInput } from "@/lib/validators/user";
import type { PatchUserProfileInput } from "@/lib/validators/user-profile";
import {
  assertProviderProfileOnRoleAssign,
  upsertListenerProfile,
  upsertTherapistProfile,
} from "@/server/services/provider-profile-service";
import { emitAdminUserUpdated } from "@/server/services/platform-events";

const adminUserListInclude = {
  wallet: true,
  therapistProfile: true,
  listenerProfile: true,
  applications: {
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.UserInclude;

export type UserProfileSessionStats = {
  completedCount: number;
  totalMinutesCompleted: number;
  streakDays: number;
  reviewsGivenCount: number;
  avgRatingGiven: number | null;
};

function streakDaysFromSessionDates(dates: Date[], now = new Date()): number {
  const dayKeys = new Set<string>();
  for (const d of dates) {
    const x = new Date(d);
    dayKeys.add(`${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`);
  }
  let streak = 0;
  const today = new Date(now);
  for (let i = 0; i < 120; i++) {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dayKeys.has(key)) streak += 1;
    else break;
  }
  return streak;
}

async function computeUserProfileSessionStats(userId: string): Promise<UserProfileSessionStats> {
  const completed = await prisma.careSession.findMany({
    where: {
      status: CareSessionStatus.COMPLETED,
      OR: [{ userId }, { providerId: userId }],
    },
    select: { startTime: true, duration: true },
  });

  const totalMinutesCompleted = completed.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const streakDays = streakDaysFromSessionDates(completed.map((s) => s.startTime));

  const reviewAgg = await prisma.sessionReview.aggregate({
    where: { reviewerId: userId },
    _avg: { rating: true },
    _count: true,
  });

  return {
    completedCount: completed.length,
    totalMinutesCompleted,
    streakDays,
    reviewsGivenCount: reviewAgg._count,
    avgRatingGiven: reviewAgg._avg.rating != null ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
  };
}

export async function getUserMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      therapistProfile: true,
      listenerProfile: true,
      applications: {
        orderBy: { createdAt: "desc" },
      },
      packagePurchases: {
        include: {
          allocations: true,
        },
        orderBy: { purchaseDate: "desc" },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User was not found.", "USER_NOT_FOUND");
  }

  const [welcomeBonus, profileSessionStats] = await Promise.all([
    getWelcomeBonusState(userId),
    computeUserProfileSessionStats(userId),
  ]);

  return { ...user, welcomeBonus, profileSessionStats };
}

export async function patchUserMe(userId: string, input: PatchUserProfileInput) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!existing) {
    throw new ApiError(404, "User was not found.", "USER_NOT_FOUND");
  }

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }
  if (input.bio !== undefined) {
    const t = input.bio.trim();
    data.bio = t.length > 0 ? t : null;
  }
  if (input.phone !== undefined) {
    const t = input.phone.trim();
    data.phone = t.length > 0 ? t : null;
  }
  if (input.city !== undefined) {
    const t = input.city.trim();
    data.city = t.length > 0 ? t : null;
  }
  if (input.timezone !== undefined) {
    data.timezone = input.timezone.trim();
  }
  if (input.primaryFocus !== undefined) {
    const t = input.primaryFocus.trim();
    data.primaryFocus = t.length > 0 ? t : null;
  }
  if (input.interestTags !== undefined) {
    data.interestTags = input.interestTags.map((t) => t.trim()).filter(Boolean);
  }

  const hasUserFields = Object.keys(data).length > 0;
  const hasProviderFields =
    input.therapistProfile !== undefined || input.listenerProfile !== undefined;

  if (!hasUserFields && !hasProviderFields) {
    return getUserMe(userId);
  }

  if (input.therapistProfile) {
    if (existing.role !== Role.THERAPIST) {
      throw new ApiError(400, "Therapist profile can only be updated for therapist accounts.", "ROLE_MISMATCH");
    }
    await upsertTherapistProfile(userId, input.therapistProfile);
  }

  if (input.listenerProfile) {
    if (existing.role !== Role.LISTENER) {
      throw new ApiError(400, "Listener profile can only be updated for listener accounts.", "ROLE_MISMATCH");
    }
    await upsertListenerProfile(userId, input.listenerProfile);
  }

  if (hasUserFields) {
    await prisma.user.update({ where: { id: userId }, data });
  }

  return getUserMe(userId);
}

export async function listUsersForAdmin(filters: {
  role?: Role;
  query?: string;
  take?: number;
}) {
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { email: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.user.findMany({
    where,
    include: adminUserListInclude,
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 100,
  });
}

export async function patchUserByAdmin(actorUserId: string, targetUserId: string, input: AdminPatchUserInput) {
  if (actorUserId === targetUserId && input.role !== undefined) {
    throw new ApiError(
      403,
      "You cannot change your own role from the admin panel. Ask another administrator if needed.",
      "SELF_ROLE_FORBIDDEN",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: adminUserListInclude,
  });

  if (!existing) {
    throw new ApiError(404, "User was not found.", "USER_NOT_FOUND");
  }

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    const t = input.name.trim();
    data.name = t.length > 0 ? t : null;
  }
  if (input.email !== undefined) {
    data.email = input.email.trim().toLowerCase();
  }
  if (input.role !== undefined) {
    data.role = input.role as Role;
  }
  if (input.isVerified !== undefined) {
    data.isVerified = input.isVerified;
  }
  if (input.bio !== undefined) {
    const t = input.bio.trim();
    data.bio = t.length > 0 ? t : null;
  }
  if (input.phone !== undefined) {
    const t = input.phone.trim();
    data.phone = t.length > 0 ? t : null;
  }
  if (input.city !== undefined) {
    const t = input.city.trim();
    data.city = t.length > 0 ? t : null;
  }
  if (input.timezone !== undefined) {
    data.timezone = input.timezone.trim();
  }
  if (input.primaryFocus !== undefined) {
    const t = input.primaryFocus.trim();
    data.primaryFocus = t.length > 0 ? t : null;
  }
  if (input.interestTags !== undefined) {
    data.interestTags = input.interestTags.map((t) => t.trim()).filter(Boolean);
  }

  const nextRole = (input.role ?? existing.role) as Role;
  assertProviderProfileOnRoleAssign(
    nextRole,
    existing,
    input.therapistProfile,
    input.listenerProfile,
  );

  const hasUserFields = Object.keys(data).length > 0;
  const hasProviderFields =
    input.therapistProfile !== undefined || input.listenerProfile !== undefined;

  if (!hasUserFields && !hasProviderFields) {
    return existing;
  }

  try {
    if (hasUserFields) {
      await prisma.user.update({
        where: { id: targetUserId },
        data,
      });
    }

    if (input.therapistProfile && nextRole === Role.THERAPIST) {
      await upsertTherapistProfile(targetUserId, input.therapistProfile);
    }

    if (input.listenerProfile && nextRole === Role.LISTENER) {
      await upsertListenerProfile(targetUserId, input.listenerProfile);
    }

    const updated = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: adminUserListInclude,
    });

    if (!updated) {
      throw new ApiError(404, "User was not found.", "USER_NOT_FOUND");
    }

    void emitAdminUserUpdated({
      actorId: actorUserId,
      before: existing,
      after: updated,
      patch: input,
    }).catch((err) => console.error("[platform-events] admin user update:", err));

    return updated;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "That email address is already in use.", "EMAIL_IN_USE");
    }
    throw error;
  }
}
