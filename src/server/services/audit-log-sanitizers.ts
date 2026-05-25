import type { Role } from "@prisma/client";
import type { AdminPatchUserInput } from "@/lib/validators/user";

const MAX_ADMIN_NOTE = 200;

export type SanitizedAuditDetails = Record<string, unknown>;

type UserAuditSnapshot = {
  role: Role;
  isVerified: boolean;
  name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  timezone: string | null;
  primaryFocus: string | null;
  interestTagsCount: number;
  therapistProfile?: {
    hourlyRate: string | null;
    experienceYears: number | null;
    specializationsCount: number;
    certificationsCount: number;
  } | null;
  listenerProfile?: {
    languagesCount: number;
    emotionalStrengthsCount: number;
  } | null;
};

function normalizeUserSnapshot(user: {
  role: Role;
  isVerified: boolean;
  name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  timezone: string | null;
  primaryFocus: string | null;
  interestTags: string[];
  therapistProfile?: {
    hourlyRate: { toString(): string } | null;
    experienceYears: number | null;
    specializations: string[];
    certifications: string[];
  } | null;
  listenerProfile?: {
    languages: string[];
    emotionalStrengths: string[];
  } | null;
}): UserAuditSnapshot {
  return {
    role: user.role,
    isVerified: user.isVerified,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    timezone: user.timezone,
    primaryFocus: user.primaryFocus,
    interestTagsCount: user.interestTags.length,
    therapistProfile: user.therapistProfile
      ? {
          hourlyRate: user.therapistProfile.hourlyRate?.toString() ?? null,
          experienceYears: user.therapistProfile.experienceYears,
          specializationsCount: user.therapistProfile.specializations.length,
          certificationsCount: user.therapistProfile.certifications.length,
        }
      : null,
    listenerProfile: user.listenerProfile
      ? {
          languagesCount: user.listenerProfile.languages.length,
          emotionalStrengthsCount: user.listenerProfile.emotionalStrengths.length,
        }
      : null,
  };
}

function diffSnapshots(before: UserAuditSnapshot, after: UserAuditSnapshot): SanitizedAuditDetails {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  const scalarKeys: (keyof Omit<UserAuditSnapshot, "therapistProfile" | "listenerProfile">)[] = [
    "role",
    "isVerified",
    "name",
    "email",
    "phone",
    "city",
    "timezone",
    "primaryFocus",
    "interestTagsCount",
  ];

  for (const key of scalarKeys) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }

  if (before.therapistProfile || after.therapistProfile) {
    const tpBefore = before.therapistProfile;
    const tpAfter = after.therapistProfile;
    if (JSON.stringify(tpBefore) !== JSON.stringify(tpAfter)) {
      changes.therapistProfile = { from: tpBefore, to: tpAfter };
    }
  }

  if (before.listenerProfile || after.listenerProfile) {
    const lpBefore = before.listenerProfile;
    const lpAfter = after.listenerProfile;
    if (JSON.stringify(lpBefore) !== JSON.stringify(lpAfter)) {
      changes.listenerProfile = { from: lpBefore, to: lpAfter };
    }
  }

  return { changes };
}

export function sanitizeAdminUserUpdateDetails(
  before: Parameters<typeof normalizeUserSnapshot>[0],
  after: Parameters<typeof normalizeUserSnapshot>[0],
  input: AdminPatchUserInput,
): SanitizedAuditDetails {
  const details = diffSnapshots(normalizeUserSnapshot(before), normalizeUserSnapshot(after));
  const touchedFields = Object.keys(input).filter((k) => k !== "therapistProfile" && k !== "listenerProfile");
  if (input.therapistProfile) touchedFields.push("therapistProfile");
  if (input.listenerProfile) touchedFields.push("listenerProfile");
  return { ...details, touchedFields };
}

export function sanitizeApplicationReviewDetails(input: {
  applicationId: string;
  type: string;
  status: string;
  reviewedBy: string;
  adminNote?: string | null;
}): SanitizedAuditDetails {
  const note =
    input.adminNote && input.adminNote.length > MAX_ADMIN_NOTE
      ? `${input.adminNote.slice(0, MAX_ADMIN_NOTE)}…`
      : input.adminNote ?? null;

  return {
    applicationId: input.applicationId,
    type: input.type,
    status: input.status,
    reviewedBy: input.reviewedBy,
    adminNote: note,
  };
}

export function sanitizeStatusChangeDetails(input: {
  id: string;
  fromStatus: string;
  toStatus: string;
  actorId?: string;
  bookingId?: string;
  sessionId?: string;
}): SanitizedAuditDetails {
  return {
    id: input.id,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.bookingId ? { bookingId: input.bookingId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  };
}

export function sanitizeWalletTransactionDetails(input: {
  transactionId: string;
  type: string;
  amount: string;
  userId: string;
  purpose?: string;
}): SanitizedAuditDetails {
  return {
    transactionId: input.transactionId,
    type: input.type,
    amount: input.amount,
    userId: input.userId,
    ...(input.purpose ? { purpose: input.purpose } : {}),
  };
}

export { auditActionCategory } from "@/lib/audit-display";
