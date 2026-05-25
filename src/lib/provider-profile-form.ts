import type { ApiListenerProfile, ApiTherapistProfile, ApiUser } from "@/types/api";
import { normalizeTimeToHHmm, normalizeWeeklyWindows } from "@/lib/time-format";
import {
  listenerProfilePatchSchema,
  therapistProfilePatchSchema,
  type ListenerProfilePatchInput,
  type TherapistProfilePatchInput,
} from "@/lib/validators/provider-profile";

export type WeeklyWindow = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
};

const defaultWeeklyAvailability: WeeklyWindow[] = [
  { id: "weekly-default-1", dayOfWeek: 1, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-2", dayOfWeek: 2, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-3", dayOfWeek: 3, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-4", dayOfWeek: 4, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-5", dayOfWeek: 5, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
];

export function splitCommaList(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function weeklyFromJson(availability: unknown): WeeklyWindow[] {
  if (!Array.isArray(availability) || availability.length === 0) {
    return defaultWeeklyAvailability;
  }
  return normalizeWeeklyWindows(
    availability.map((row) => {
      const w = row as Record<string, unknown>;
      return {
        dayOfWeek: Number(w.dayOfWeek ?? 1),
        startTime: normalizeTimeToHHmm(String(w.startTime ?? "18:00")),
        endTime: normalizeTimeToHHmm(String(w.endTime ?? "21:00")),
        timezone: w.timezone ? String(w.timezone) : "Asia/Kolkata",
      };
    }),
  );
}

export function weeklyFromScheduleRows(
  rows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string | null;
  }>,
): WeeklyWindow[] {
  if (!rows.length) return defaultWeeklyAvailability;
  return normalizeWeeklyWindows(
    rows.map((row, index) => ({
      id: `weekly-schedule-${index}`,
      dayOfWeek: row.dayOfWeek,
      startTime: normalizeTimeToHHmm(row.startTime),
      endTime: normalizeTimeToHHmm(row.endTime),
      timezone: row.timezone ?? "Asia/Kolkata",
    })),
  );
}

export function therapistFormFromUser(
  user: ApiUser,
  weekly: WeeklyWindow[],
): {
  profileBio: string;
  specialization: string;
  certificationsRaw: string;
  experienceYears: string;
  hourlyRate: string;
  weekly: WeeklyWindow[];
} {
  const tp = user.therapistProfile;
  return {
    profileBio: tp?.bio?.trim() || user.bio?.trim() || "",
    specialization: tp?.specializations?.join(", ") ?? "",
    certificationsRaw: tp?.certifications?.join(", ") ?? "",
    experienceYears: String(tp?.experienceYears ?? 3),
    hourlyRate: tp?.hourlyRate ? String(Math.round(Number(tp.hourlyRate))) : "1500",
    weekly: weekly.length ? weekly : weeklyFromJson(tp?.availability),
  };
}

export function listenerFormFromUser(
  user: ApiUser,
  weekly: WeeklyWindow[],
): {
  profileBio: string;
  languagesRaw: string;
  interestsRaw: string;
  weekly: WeeklyWindow[];
} {
  const lp = user.listenerProfile;
  return {
    profileBio: lp?.bio?.trim() || user.bio?.trim() || "",
    languagesRaw: lp?.languages?.join(", ") ?? "",
    interestsRaw: lp?.emotionalStrengths?.join(", ") ?? "",
    weekly: weekly.length ? weekly : weeklyFromJson(lp?.availability),
  };
}

export function buildTherapistProfilePayload(form: {
  profileBio: string;
  specialization: string;
  certificationsRaw: string;
  experienceYears: string;
  hourlyRate: string;
  weekly: WeeklyWindow[];
}): { ok: true; data: TherapistProfilePatchInput } | { ok: false; errors: Record<string, string> } {
  const parsed = therapistProfilePatchSchema.safeParse({
    bio: form.profileBio,
    specialization: form.specialization,
    certifications: splitCommaList(form.certificationsRaw),
    experienceYears: Number(form.experienceYears),
    hourlyRate: Number(form.hourlyRate),
    weeklyAvailability: normalizeWeeklyWindows(form.weekly),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
      if (!(key in errors)) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, data: parsed.data };
}

export function buildListenerProfilePayload(form: {
  profileBio: string;
  languagesRaw: string;
  interestsRaw: string;
  weekly: WeeklyWindow[];
}): { ok: true; data: ListenerProfilePatchInput } | { ok: false; errors: Record<string, string> } {
  const parsed = listenerProfilePatchSchema.safeParse({
    bio: form.profileBio,
    languages: splitCommaList(form.languagesRaw),
    emotionalStrengths: splitCommaList(form.interestsRaw),
    weeklyAvailability: normalizeWeeklyWindows(form.weekly),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
      if (!(key in errors)) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, data: parsed.data };
}

export function therapistProfileLooksComplete(tp: ApiTherapistProfile | null | undefined): boolean {
  if (!tp) return false;
  return (
    Boolean(tp.bio?.trim()) &&
    tp.specializations.length > 0 &&
    tp.certifications.length > 0 &&
    tp.experienceYears != null &&
    tp.hourlyRate != null &&
    Number(tp.hourlyRate) > 0
  );
}

export function listenerProfileLooksComplete(lp: ApiListenerProfile | null | undefined): boolean {
  if (!lp) return false;
  return (
    Boolean(lp.bio?.trim()) &&
    lp.languages.length > 0 &&
    lp.emotionalStrengths.length > 0
  );
}
