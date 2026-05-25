import type { BookingStatus, CareSessionStatus, ListenerRequestStatus, Role } from "@prisma/client";
import { recordAuditLog } from "@/server/services/audit-log-service";
import {
  sanitizeAdminUserUpdateDetails,
  sanitizeApplicationReviewDetails,
  sanitizeStatusChangeDetails,
  sanitizeWalletTransactionDetails,
} from "@/server/services/audit-log-sanitizers";
import { createNotification, notifyUsers } from "@/server/services/notification-service";
import type { AdminPatchUserInput } from "@/lib/validators/user";

type UserWithProfiles = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isVerified: boolean;
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
};

export async function emitAdminUserUpdated(input: {
  actorId: string;
  before: UserWithProfiles;
  after: UserWithProfiles;
  patch: AdminPatchUserInput;
}) {
  const label = input.after.name ?? input.after.email;
  const details = sanitizeAdminUserUpdateDetails(input.before, input.after, input.patch);

  await recordAuditLog({
    action: "USER_UPDATED_BY_ADMIN",
    actorId: input.actorId,
    targetType: "user",
    targetId: input.after.id,
    summary: `Admin updated profile for ${label}`,
    details,
  });

  const roleChanged = input.before.role !== input.after.role;
  const verifiedChanged = input.before.isVerified !== input.after.isVerified;

  if (roleChanged || verifiedChanged) {
    const parts: string[] = [];
    if (roleChanged) parts.push(`role is now ${input.after.role}`);
    if (verifiedChanged) {
      parts.push(input.after.isVerified ? "account verified" : "verification removed");
    }

    await createNotification({
      userId: input.after.id,
      type: "ADMIN_USER_UPDATED",
      title: "Your account was updated",
      body: `An administrator updated your account: ${parts.join("; ")}.`,
      href: "/dashboard/profile",
    });
  }
}

export async function emitApplicationReviewed(input: {
  reviewerId: string;
  applicationId: string;
  userId: string;
  type: string;
  status: "APPROVED" | "REJECTED";
  adminNote?: string | null;
}) {
  const approved = input.status === "APPROVED";

  await recordAuditLog({
    action: "APPLICATION_REVIEWED",
    actorId: input.reviewerId,
    targetType: "application",
    targetId: input.applicationId,
    summary: `${input.type} application ${input.status.toLowerCase()}`,
    details: sanitizeApplicationReviewDetails({
      applicationId: input.applicationId,
      type: input.type,
      status: input.status,
      reviewedBy: input.reviewerId,
      adminNote: input.adminNote,
    }),
  });

  await createNotification({
    userId: input.userId,
    type: approved ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
    title: approved ? "Application approved" : "Application not approved",
    body: approved
      ? `Your ${input.type.toLowerCase()} application was approved. You can access your professional workspace.`
      : `Your ${input.type.toLowerCase()} application was reviewed. Check your profile for next steps.`,
    href: "/dashboard/profile",
  });
}

export async function emitBookingStatusChanged(input: {
  actorId: string;
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  userId: string;
  sessionId?: string | null;
}) {
  if (input.fromStatus === input.toStatus) return;

  await recordAuditLog({
    action: "BOOKING_STATUS_CHANGED",
    actorId: input.actorId,
    targetType: "booking",
    targetId: input.bookingId,
    summary: `Booking ${input.fromStatus} → ${input.toStatus}`,
    details: sanitizeStatusChangeDetails({
      id: input.bookingId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorId: input.actorId,
      sessionId: input.sessionId ?? undefined,
    }),
  });

  const typeMap = {
    ACCEPTED: "BOOKING_ACCEPTED" as const,
    REJECTED: "BOOKING_REJECTED" as const,
    CANCELLED: "BOOKING_CANCELLED" as const,
    COMPLETED: null,
    PENDING: null,
  };

  const notifType = typeMap[input.toStatus];
  if (!notifType) return;

  const title =
    input.toStatus === "ACCEPTED"
      ? "Booking accepted"
      : input.toStatus === "REJECTED"
        ? "Booking declined"
        : "Booking cancelled";

  await createNotification({
    userId: input.userId,
    type: notifType,
    title,
    body: `Your booking request is now ${input.toStatus.toLowerCase()}.`,
    href: "/dashboard",
  });
}

export async function emitSessionStatusChanged(input: {
  actorId: string;
  sessionId: string;
  fromStatus: CareSessionStatus;
  toStatus: CareSessionStatus;
  userId: string;
  providerId: string;
  bookingId?: string | null;
}) {
  if (input.fromStatus === input.toStatus) return;

  await recordAuditLog({
    action: "SESSION_STATUS_CHANGED",
    actorId: input.actorId,
    targetType: "session",
    targetId: input.sessionId,
    summary: `Session ${input.fromStatus} → ${input.toStatus}`,
    details: sanitizeStatusChangeDetails({
      id: input.sessionId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorId: input.actorId,
      bookingId: input.bookingId ?? undefined,
    }),
  });

  const notifyMap: Partial<
    Record<
      CareSessionStatus,
      { type: "SESSION_STARTED" | "SESSION_COMPLETED" | "SESSION_CANCELLED" | "SESSION_MISSED"; title: string; body: string }
    >
  > = {
    ONGOING: {
      type: "SESSION_STARTED",
      title: "Session started",
      body: "Your session is now in progress.",
    },
    COMPLETED: {
      type: "SESSION_COMPLETED",
      title: "Session completed",
      body: "Your session has been marked complete.",
    },
    CANCELLED: {
      type: "SESSION_CANCELLED",
      title: "Session cancelled",
      body: "Your session was cancelled.",
    },
    MISSED: {
      type: "SESSION_MISSED",
      title: "Session missed",
      body: "A scheduled session was marked as missed.",
    },
  };

  const payload = notifyMap[input.toStatus];
  if (!payload) return;

  await notifyUsers([input.userId, input.providerId], {
    type: payload.type,
    title: payload.title,
    body: payload.body,
    href: "/dashboard",
  });
}

export async function emitListenerRequestUpdated(input: {
  adminId: string;
  requestId: string;
  fromStatus: ListenerRequestStatus;
  toStatus: ListenerRequestStatus;
  userId: string;
  assignedListenerId?: string | null;
}) {
  if (input.fromStatus === input.toStatus) return;

  await recordAuditLog({
    action: "LISTENER_REQUEST_UPDATED",
    actorId: input.adminId,
    targetType: "listener_request",
    targetId: input.requestId,
    summary: `Listener request ${input.fromStatus} → ${input.toStatus}`,
    details: sanitizeStatusChangeDetails({
      id: input.requestId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorId: input.adminId,
    }),
  });

  if (input.toStatus === "ASSIGNED" && input.assignedListenerId) {
    await notifyUsers([input.assignedListenerId, input.userId], {
      type: "LISTENER_REQUEST_ASSIGNED",
      title: "Listener request assigned",
      body: "A listener support request was assigned and awaits confirmation.",
      href: "/dashboard/listener-inbox",
    });
    return;
  }

  if (input.toStatus === "APPROVED") {
    await notifyUsers([input.userId, ...(input.assignedListenerId ? [input.assignedListenerId] : [])], {
      type: "LISTENER_REQUEST_APPROVED",
      title: "Listener session confirmed",
      body: "Your listener session request was approved.",
      href: "/dashboard",
    });
    return;
  }

  if (input.toStatus === "DECLINED") {
    await createNotification({
      userId: input.userId,
      type: "LISTENER_REQUEST_DECLINED",
      title: "Listener request closed",
      body: "Your listener support request was declined or closed.",
      href: "/dashboard",
    });
  }
}

export async function emitWalletTransaction(input: {
  actorId?: string;
  transactionId: string;
  type: "CREDIT" | "DEBIT";
  amount: string;
  userId: string;
  purpose: string;
}) {
  await recordAuditLog({
    action: "WALLET_TRANSACTION",
    actorId: input.actorId ?? null,
    targetType: "transaction",
    targetId: input.transactionId,
    summary: `Wallet ${input.type.toLowerCase()} · ${input.amount}`,
    details: sanitizeWalletTransactionDetails({
      transactionId: input.transactionId,
      type: input.type,
      amount: input.amount,
      userId: input.userId,
      purpose: input.purpose,
    }),
  });

  await createNotification({
    userId: input.userId,
    type: input.type === "CREDIT" ? "WALLET_CREDIT" : "WALLET_DEBIT",
    title: input.type === "CREDIT" ? "Wallet credited" : "Wallet debited",
    body: `${input.purpose}: ${input.amount}`,
    href: "/dashboard/wallet",
  });
}

export async function emitJournalReminder(input: { userId: string; journalDateKey: string }) {
  await createNotification({
    userId: input.userId,
    type: "JOURNAL_REMINDER",
    title: "Your journal is waiting",
    body: "Take a few quiet minutes to write today's reflection and keep your streak growing.",
    href: "/dashboard/journal/write",
    metadata: { journalDateKey: input.journalDateKey },
  });
}

export async function emitClubCreationApproved(input: {
  userId: string;
  clubId: string;
  clubSlug: string;
  clubTitle: string;
}) {
  await recordAuditLog({
    action: "CLUB_CREATION_REVIEWED",
    targetType: "club_creation_request",
    targetId: input.clubId,
    summary: `Club "${input.clubTitle}" approved`,
    details: { clubId: input.clubId, status: "APPROVED" },
  });

  await createNotification({
    userId: input.userId,
    type: "CLUB_CREATION_APPROVED",
    title: "Your club is live",
    body: `"${input.clubTitle}" was approved. You can manage members and join requests.`,
    href: `/dashboard/clubs/${input.clubSlug}`,
  });
}

export async function emitClubCreationRejected(input: {
  userId: string;
  requestId: string;
  adminNote?: string | null;
}) {
  await createNotification({
    userId: input.userId,
    type: "CLUB_CREATION_REJECTED",
    title: "Club request not approved",
    body: input.adminNote?.trim()
      ? input.adminNote
      : "Your club creation request was reviewed. You may submit again with changes.",
    href: "/dashboard/clubs",
  });
}

export async function emitClubJoinRequestReceived(input: {
  ownerUserId: string;
  requesterId: string;
  requesterLabel: string;
  clubId: string;
  clubTitle: string;
  clubSlug: string;
  requestId: string;
}) {
  await createNotification({
    userId: input.ownerUserId,
    type: "CLUB_JOIN_REQUEST_RECEIVED",
    title: "New join request",
    body: `${input.requesterLabel} wants to join "${input.clubTitle}".`,
    href: `/dashboard/clubs/${input.clubSlug}`,
    metadata: { requestId: input.requestId, requesterId: input.requesterId },
  });
}

export async function emitClubJoinApproved(input: {
  userId: string;
  clubId: string;
  clubTitle: string;
  clubSlug: string;
}) {
  await recordAuditLog({
    action: "CLUB_JOIN_REVIEWED",
    targetType: "club_join_request",
    targetId: input.clubId,
    summary: `Join approved for ${input.clubTitle}`,
    details: { status: "APPROVED" },
  });

  await createNotification({
    userId: input.userId,
    type: "CLUB_JOIN_APPROVED",
    title: "Welcome to the club",
    body: `You are now a member of "${input.clubTitle}".`,
    href: `/dashboard/clubs/${input.clubSlug}`,
  });
}

export async function emitClubJoinRejected(input: {
  userId: string;
  clubId: string;
  clubTitle: string;
  adminNote?: string | null;
}) {
  await createNotification({
    userId: input.userId,
    type: "CLUB_JOIN_REJECTED",
    title: "Join request declined",
    body: input.adminNote?.trim()
      ? input.adminNote
      : `Your request to join "${input.clubTitle}" was not approved.`,
    href: `/dashboard/clubs`,
  });
}

export async function emitClubSubscriptionCharged(input: {
  userId: string;
  clubId: string;
  clubTitle: string;
  amount: string;
  membershipId: string;
}) {
  await recordAuditLog({
    action: "CLUB_MEMBERSHIP_BILLING",
    targetType: "club_membership",
    targetId: input.membershipId,
    summary: `Club subscription charged · ${input.amount}`,
    details: { clubId: input.clubId, status: "SUCCESS" },
  });

  await createNotification({
    userId: input.userId,
    type: "CLUB_SUBSCRIPTION_CHARGED",
    title: "Club subscription paid",
    body: `${input.amount} was charged for "${input.clubTitle}".`,
    href: "/dashboard/wallet",
    metadata: { clubId: input.clubId },
  });
}

export async function emitClubSubscriptionFailed(input: {
  userId: string;
  clubId: string;
  clubTitle: string;
  amount: string;
  membershipId: string;
}) {
  await createNotification({
    userId: input.userId,
    type: "CLUB_SUBSCRIPTION_FAILED",
    title: "Club payment failed",
    body: `We could not charge ${input.amount} for "${input.clubTitle}". Please top up your wallet.`,
    href: "/dashboard/wallet",
    metadata: { clubId: input.clubId },
  });
}

export async function emitClubMemberPaymentOverdue(input: {
  ownerUserId: string;
  memberUserId: string;
  memberLabel: string;
  clubId: string;
  clubTitle: string;
  membershipId: string;
  forAdmin?: boolean;
}) {
  await createNotification({
    userId: input.ownerUserId,
    type: "CLUB_MEMBER_PAYMENT_OVERDUE",
    title: input.forAdmin ? "Member payment overdue" : "Member has not paid",
    body: `${input.memberLabel} has not paid for "${input.clubTitle}".`,
    href: input.forAdmin ? "/admin/clubs" : `/dashboard/clubs/${input.clubId}`,
    metadata: {
      membershipId: input.membershipId,
      memberUserId: input.memberUserId,
    },
  });
}

export async function emitEventRegistrationConfirmed(input: {
  userId: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  amount: string;
}) {
  await recordAuditLog({
    action: "EVENT_REGISTRATION_CREATED",
    targetType: "event_registration",
    targetId: input.eventId,
    summary: `Registration for ${input.eventTitle}`,
    details: { amount: input.amount },
  });

  await createNotification({
    userId: input.userId,
    type: "EVENT_REGISTRATION_CONFIRMED",
    title: "You are registered",
    body:
      Number(input.amount) > 0
        ? `Your spot for "${input.eventTitle}" is confirmed. ₹${input.amount} was charged.`
        : `Your spot for "${input.eventTitle}" is confirmed.`,
    href: `/dashboard/events/${input.eventSlug}`,
  });
}

export async function emitEventRegistrationReceived(input: {
  organizerUserId: string;
  registrantLabel: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  registrationId: string;
}) {
  await createNotification({
    userId: input.organizerUserId,
    type: "EVENT_REGISTRATION_RECEIVED",
    title: "New event registration",
    body: `${input.registrantLabel} registered for "${input.eventTitle}".`,
    href: `/dashboard/events/${input.eventSlug}`,
    metadata: { registrationId: input.registrationId },
  });
}

export async function emitEventRegistrationCancelled(input: {
  userId: string;
  eventTitle: string;
  eventSlug: string;
}) {
  await createNotification({
    userId: input.userId,
    type: "EVENT_REGISTRATION_CANCELLED",
    title: "Registration cancelled",
    body: `Your registration for "${input.eventTitle}" was cancelled.`,
    href: `/dashboard/events/${input.eventSlug}`,
  });
}
