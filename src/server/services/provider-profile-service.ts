import type { ListenerProfile, Prisma, TherapistProfile } from "@prisma/client";
import { Role } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import type {
  ListenerProfilePatchInput,
  TherapistProfilePatchInput,
} from "@/lib/validators/provider-profile";
import { normalizeWeeklyWindows } from "@/lib/time-format";
import { landingFieldsToDb } from "@/lib/provider-profile-form";
import { replaceListenerWeeklySchedule } from "@/server/services/listener-availability-service";
import { replaceTherapistWeeklySchedule } from "@/server/services/therapist-availability-service";

export function specializationToArray(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasWeeklyWindows(availability: unknown): boolean {
  return Array.isArray(availability) && availability.length > 0;
}

export function isTherapistProfileComplete(profile: TherapistProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    Boolean(profile.bio?.trim()) &&
    profile.specializations.length > 0 &&
    profile.certifications.length > 0 &&
    profile.experienceYears != null &&
    profile.hourlyRate != null &&
    Number(profile.hourlyRate) > 0 &&
    hasWeeklyWindows(profile.availability)
  );
}

export function isListenerProfileComplete(profile: ListenerProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    Boolean(profile.bio?.trim()) &&
    profile.languages.length > 0 &&
    profile.emotionalStrengths.length > 0 &&
    hasWeeklyWindows(profile.availability)
  );
}

function mapWeeklyToSchedule(
  weekly: TherapistProfilePatchInput["weeklyAvailability"],
) {
  return normalizeWeeklyWindows(weekly).map((w) => ({
    dayOfWeek: w.dayOfWeek,
    startTime: w.startTime,
    endTime: w.endTime,
    timezone: w.timezone,
    isActive: true,
  }));
}

export async function upsertTherapistProfile(userId: string, input: TherapistProfilePatchInput) {
  const specs = specializationToArray(input.specialization);
  const availability = input.weeklyAvailability as unknown as Prisma.InputJsonValue;
  const landing = landingFieldsToDb(input);

  await prisma.therapistProfile.upsert({
    where: { userId },
    create: {
      userId,
      bio: input.bio,
      specializations: specs,
      certifications: input.certifications,
      experienceYears: input.experienceYears,
      hourlyRate: input.hourlyRate,
      availability,
      links: [],
      rating: 0,
      totalSessions: 0,
      ...landing,
    },
    update: {
      bio: input.bio,
      specializations: specs,
      certifications: input.certifications,
      experienceYears: input.experienceYears,
      hourlyRate: input.hourlyRate,
      availability,
      ...landing,
    },
  });

  await replaceTherapistWeeklySchedule(userId, mapWeeklyToSchedule(input.weeklyAvailability));
}

export async function upsertListenerProfile(userId: string, input: ListenerProfilePatchInput) {
  const availability = input.weeklyAvailability as unknown as Prisma.InputJsonValue;

  await prisma.listenerProfile.upsert({
    where: { userId },
    create: {
      userId,
      bio: input.bio,
      languages: input.languages,
      emotionalStrengths: input.emotionalStrengths,
      availability,
      rating: 0,
      totalSessions: 0,
    },
    update: {
      bio: input.bio,
      languages: input.languages,
      emotionalStrengths: input.emotionalStrengths,
      availability,
    },
  });

  await replaceListenerWeeklySchedule(userId, mapWeeklyToSchedule(input.weeklyAvailability));
}

export function assertProviderProfileOnRoleAssign(
  nextRole: Role,
  existing: {
    role: Role;
    therapistProfile: TherapistProfile | null;
    listenerProfile: ListenerProfile | null;
  },
  therapistProfile?: TherapistProfilePatchInput,
  listenerProfile?: ListenerProfilePatchInput,
) {
  const roleChanging = nextRole !== existing.role;
  if (!roleChanging) return;

  if (nextRole === Role.THERAPIST) {
    if (!therapistProfile && !isTherapistProfileComplete(existing.therapistProfile)) {
      throw new ApiError(
        400,
        "Therapist details (fees, timings, education) are required when assigning the therapist role.",
        "PROVIDER_PROFILE_REQUIRED",
      );
    }
  }

  if (nextRole === Role.LISTENER) {
    if (!listenerProfile && !isListenerProfileComplete(existing.listenerProfile)) {
      throw new ApiError(
        400,
        "Listener details (interests, languages, timings) are required when assigning the listener role.",
        "PROVIDER_PROFILE_REQUIRED",
      );
    }
  }
}
