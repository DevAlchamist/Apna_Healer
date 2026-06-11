import {
  ApplicationType,
  Prisma,
  ProfessionalApplicationStatus,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  parseListenerApplicationData,
  parseTherapistApplicationData,
  createProfessionalApplicationSchema,
} from "@/lib/validators/professional-application";
import { replaceListenerWeeklySchedule } from "@/server/services/listener-availability-service";
import { replaceTherapistWeeklySchedule } from "@/server/services/therapist-availability-service";
import { emitApplicationReviewed } from "@/server/services/platform-events";
import { landingFieldsToDb } from "@/lib/provider-profile-form";
import type { z } from "zod";

type CreateInput = z.infer<typeof createProfessionalApplicationSchema>;

function specializationToArray(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function listProfessionalApplications(
  actorId: string,
  actorRole: Role,
  filters: {
    status?: ProfessionalApplicationStatus;
    type?: ApplicationType;
    take?: number;
  },
) {
  const take = filters.take ?? 25;

  if (actorRole === Role.ADMIN) {
    return prisma.professionalApplication.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  return prisma.professionalApplication.findMany({
    where: {
      userId: actorId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getProfessionalApplicationForActor(
  applicationId: string,
  actorId: string,
  actorRole: Role,
) {
  const row = await prisma.professionalApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });

  if (!row) {
    throw new ApiError(404, "Application was not found.", "APPLICATION_NOT_FOUND");
  }

  if (actorRole !== Role.ADMIN && row.userId !== actorId) {
    throw new ApiError(403, "You cannot view this application.", "FORBIDDEN");
  }

  return row;
}

export async function createProfessionalApplication(actor: { id: string; role: Role }, raw: unknown) {
  if (actor.role === Role.ADMIN) {
    throw new ApiError(400, "Admins cannot submit provider applications.", "INVALID_ACTOR");
  }

  const input = createProfessionalApplicationSchema.parse(raw) as CreateInput;

  if (input.type === ApplicationType.LISTENER && actor.role === Role.LISTENER) {
    throw new ApiError(400, "You already have listener access.", "ALREADY_LISTENER");
  }

  if (input.type === ApplicationType.THERAPIST && actor.role === Role.THERAPIST) {
    throw new ApiError(400, "You already have therapist access.", "ALREADY_THERAPIST");
  }

  const pending = await prisma.professionalApplication.findFirst({
    where: {
      userId: actor.id,
      type: input.type,
      status: ProfessionalApplicationStatus.PENDING,
    },
  });

  if (pending) {
    throw new ApiError(
      400,
      "You already have a pending application of this type.",
      "APPLICATION_PENDING_EXISTS",
    );
  }

  const approved = await prisma.professionalApplication.findFirst({
    where: {
      userId: actor.id,
      type: input.type,
      status: ProfessionalApplicationStatus.APPROVED,
    },
  });

  if (approved) {
    throw new ApiError(
      400,
      "An approved application of this type already exists.",
      "APPLICATION_ALREADY_APPROVED",
    );
  }

  const applicationData = input.applicationData as unknown as Prisma.InputJsonValue;

  return prisma.professionalApplication.create({
    data: {
      userId: actor.id,
      type: input.type,
      status: ProfessionalApplicationStatus.PENDING,
      applicationData,
    },
  });
}

export async function reviewProfessionalApplication(input: {
  applicationId: string;
  reviewerId: string;
  status?: "APPROVED" | "REJECTED";
  adminNote?: string;
}) {
  const application = await prisma.professionalApplication.findUnique({
    where: { id: input.applicationId },
    include: { user: true },
  });

  if (!application) {
    throw new ApiError(404, "Application was not found.", "APPLICATION_NOT_FOUND");
  }

  const adminNote =
    input.adminNote === undefined ? undefined : input.adminNote.trim() === "" ? null : input.adminNote.trim();

  if (input.status === undefined) {
    return prisma.professionalApplication.update({
      where: { id: application.id },
      data: {
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
      include: { user: true },
    });
  }

  const requestedStatus: ProfessionalApplicationStatus =
    input.status === "APPROVED"
      ? ProfessionalApplicationStatus.APPROVED
      : ProfessionalApplicationStatus.REJECTED;

  if (
    application.status !== ProfessionalApplicationStatus.PENDING &&
    application.status !== requestedStatus
  ) {
    throw new ApiError(
      400,
      "Only pending applications can be approved or rejected.",
      "INVALID_APPLICATION_STATE",
    );
  }

  if (application.status === requestedStatus) {
    return prisma.professionalApplication.update({
      where: { id: application.id },
      data: {
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
      include: { user: true },
    });
  }

  const nextStatus = requestedStatus;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.professionalApplication.update({
      where: { id: application.id },
      data: {
        status: nextStatus,
        reviewedBy: input.reviewerId,
        reviewedAt: new Date(),
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });

    if (nextStatus === ProfessionalApplicationStatus.APPROVED) {
      const approvedRole =
        application.type === ApplicationType.THERAPIST ? Role.THERAPIST : Role.LISTENER;

      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: approvedRole,
          isVerified: true,
        },
      });

      if (application.type === ApplicationType.LISTENER) {
        const data = parseListenerApplicationData(application.applicationData);
        await tx.listenerProfile.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            bio: data.bio,
            languages: data.languages,
            emotionalStrengths: data.emotionalStrengths,
            availability: data.weeklyAvailability as unknown as Prisma.InputJsonValue,
            rating: 0,
            totalSessions: 0,
          },
          update: {
            bio: data.bio,
            languages: data.languages,
            emotionalStrengths: data.emotionalStrengths,
            availability: data.weeklyAvailability as unknown as Prisma.InputJsonValue,
          },
        });
      }

      if (application.type === ApplicationType.THERAPIST) {
        const data = parseTherapistApplicationData(application.applicationData);
        const specs = specializationToArray(data.specialization);
        const landing = landingFieldsToDb(data);
        await tx.therapistProfile.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            bio: data.bio,
            specializations: specs,
            certifications: data.certifications,
            experienceYears: data.yearsOfExperience,
            hourlyRate: data.pricing,
            availability: data.weeklyAvailability as unknown as Prisma.InputJsonValue,
            links: (data.optionalLinks ?? []) as unknown as Prisma.InputJsonValue,
            rating: 0,
            totalSessions: 0,
            ...landing,
          },
          update: {
            bio: data.bio,
            specializations: specs,
            certifications: data.certifications,
            experienceYears: data.yearsOfExperience,
            hourlyRate: data.pricing,
            availability: data.weeklyAvailability as unknown as Prisma.InputJsonValue,
            links: (data.optionalLinks ?? []) as unknown as Prisma.InputJsonValue,
            ...landing,
          },
        });
      }
    }

    return tx.professionalApplication.findUnique({
      where: { id: application.id },
      include: { user: true },
    });
  });

  if (!updated) {
    throw new ApiError(500, "Application review could not be finalized.", "APPLICATION_REVIEW_FAILED");
  }

  if (nextStatus === ProfessionalApplicationStatus.APPROVED) {
    try {
      if (application.type === ApplicationType.LISTENER) {
        const data = parseListenerApplicationData(application.applicationData);
        await replaceListenerWeeklySchedule(
          application.userId,
          data.weeklyAvailability.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
            timezone: w.timezone,
            isActive: true,
          })),
        );
      } else {
        const data = parseTherapistApplicationData(application.applicationData);
        await replaceTherapistWeeklySchedule(
          application.userId,
          data.weeklyAvailability.map((w) => ({
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
            timezone: w.timezone,
            isActive: true,
          })),
        );
      }
    } catch (err) {
      console.error("Weekly schedule sync after approval failed:", err);
      throw new ApiError(
        500,
        "Application was approved but weekly availability could not be synced. Please fix availability manually.",
        "AVAILABILITY_SYNC_FAILED",
      );
    }
  }

  if (
    nextStatus === ProfessionalApplicationStatus.APPROVED ||
    nextStatus === ProfessionalApplicationStatus.REJECTED
  ) {
    void emitApplicationReviewed({
      reviewerId: input.reviewerId,
      applicationId: application.id,
      userId: application.userId,
      type: application.type,
      status: nextStatus === ProfessionalApplicationStatus.APPROVED ? "APPROVED" : "REJECTED",
      adminNote: updated.adminNote,
    }).catch((err) => console.error("[platform-events] application review:", err));
  }

  return updated;
}
