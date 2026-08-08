"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  formatDateTime,
  formatDurationDayHourMinSec,
  formatShortDate,
  formatSessionScheduledDateTime,
  isCareSessionJoinWindowOpen,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiCareSession, ApiUser } from "@/types/api";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";

type ReviewState = {
  sessionId: string;
  completed: boolean;
  viewerHasReviewed: boolean;
  reviews: Array<{
    id: string;
    reviewerId: string;
    rating: number;
    feedback: string | null;
    tags: string[];
    createdAt: string;
  }>;
};

type SessionDetailsModalContextValue = {
  open: (session: ApiCareSession) => void;
  close: () => void;
};

const SessionDetailsModalContext =
  createContext<SessionDetailsModalContextValue | null>(null);

const clockFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

function formatSessionClock(iso: string) {
  return clockFormatter.format(new Date(iso));
}

function getSessionCountdown(
  startTime: string,
  durationMin: number,
  status: ApiCareSession["status"],
  nowTick: number,
): {
  primaryLabel: string;
  scheduledDisplay: string;
  countdownLine: string;
  subline: string;
} | null {
  const start = new Date(startTime).getTime();
  const end = start + durationMin * 60 * 1000;
  const now = nowTick;
  const scheduledDisplay = formatSessionScheduledDateTime(startTime);

  if (status === "COMPLETED" || status === "CANCELLED" || status === "MISSED") {
    return null;
  }

  if (status === "ONGOING") {
    const left = Math.max(0, end - now);
    return {
      primaryLabel: "Started at",
      scheduledDisplay,
      countdownLine: `Ends in ${formatDurationDayHourMinSec(left)}`,
      subline: "Time remaining in this session",
    };
  }

  if (status === "UPCOMING") {
    const left = start - now;
    if (left <= 0) {
      return {
        primaryLabel: "Scheduled start",
        scheduledDisplay,
        countdownLine: "Starting momentarily",
        subline: "Your session should begin any second now",
      };
    }
    return {
      primaryLabel: "Scheduled start",
      scheduledDisplay,
      countdownLine: `Starts in ${formatDurationDayHourMinSec(left)}`,
      subline: "Join opens 15 minutes before this time when a link is ready",
    };
  }

  return null;
}

function isListenerSupportSession(s: ApiCareSession): boolean {
  return s.sessionMode === "LISTENER";
}

function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useSessionDetailsModal() {
  const ctx = useContext(SessionDetailsModalContext);
  if (!ctx) {
    throw new Error(
      "useSessionDetailsModal must be used inside SessionDetailsModalProvider",
    );
  }
  return ctx;
}

export function SessionDetailsModalProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ApiCareSession | null>(null);

  const value = useMemo<SessionDetailsModalContextValue>(
    () => ({
      open: (input) => setSession(input),
      close: () => setSession(null),
    }),
    [],
  );

  return (
    <SessionDetailsModalContext.Provider value={value}>
      {children}
      <AnimatePresence mode="wait">
        {session ? (
          <SessionDetailsModal
            key={session.id}
            session={session}
            onClose={() => setSession(null)}
          />
        ) : null}
      </AnimatePresence>
    </SessionDetailsModalContext.Provider>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.06,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: morphTransition,
  },
} as const;

function SessionDetailsModal({
  session,
  onClose,
}: {
  session: ApiCareSession;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [localSession, setLocalSession] = useState(session);
  const [draftMeetingLink, setDraftMeetingLink] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [logisticsError, setLogisticsError] = useState<string | null>(null);
  const [sessionEndLocal, setSessionEndLocal] = useState(() =>
    toDateTimeLocalValue(new Date()),
  );
  const [rescheduleStartLocal, setRescheduleStartLocal] = useState("");
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBreatheDetail, setShowBreatheDetail] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    queueMicrotask(() => {
      setLocalSession(session);
      setDraftMeetingLink(session.meetingLink?.trim() ?? "");
      setDraftNotes(session.notes ?? "");
      setDraftDescription(session.description ?? "");
      setSessionEndLocal(toDateTimeLocalValue(new Date()));
      setRescheduleStartLocal(toDateTimeLocalValue(new Date(session.startTime)));
      setShowRescheduleForm(false);
      setShowCancelConfirm(false);
      setLogisticsError(null);
    });
  }, [session]);

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });
  const viewer = userQuery.data;

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const reviewQuery = useQuery({
    queryKey: ["session-review", localSession.id],
    queryFn: () => apiFetch<ReviewState>(`/api/sessions/${localSession.id}/reviews`),
  });

  const submitReview = useMutation({
    mutationFn: () =>
      apiMutation(`/api/sessions/${localSession.id}/reviews`, "POST", {
        rating,
        feedback: feedback.trim() || null,
        tags: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-review", localSession.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-sessions"] });
      setShowReviewForm(false);
    },
  });

  const patchSession = useMutation({
    mutationFn: (body: {
      status?: ApiCareSession["status"];
      meetingLink?: string;
      description?: string;
      notes?: string;
      endedAt?: string;
      startTime?: string;
    }) => apiMutation<ApiCareSession>(`/api/sessions/${localSession.id}`, "PATCH", body),
    onSuccess: (data) => {
      setLocalSession(data);
      setDraftMeetingLink(data.meetingLink?.trim() ?? "");
      setDraftNotes(data.notes ?? "");
      setDraftDescription(data.description ?? "");
      setRescheduleStartLocal(toDateTimeLocalValue(new Date(data.startTime)));
      setShowRescheduleForm(false);
      setShowCancelConfirm(false);
      setLogisticsError(null);
      void queryClient.invalidateQueries({ queryKey: ["listener-inbox-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["consultations-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-shell-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-listener-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-sessions-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-control-center"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      setLogisticsError(error.message);
    },
  });

  const completed = reviewQuery.data?.completed ?? false;
  const viewerHasReviewed = reviewQuery.data?.viewerHasReviewed ?? false;

  const counterpartyName = sessionCounterpartyLabel(localSession, viewer?.id);
  const isParticipant = viewer?.id === localSession.userId;
  const otherParty =
    viewer?.id === localSession.userId
      ? localSession.provider
      : localSession.user ?? localSession.provider;

  const joinReady =
    !!localSession.meetingLink?.trim() &&
    isCareSessionJoinWindowOpen(localSession, new Date(nowTick));

  const countdown = useMemo(
    () =>
      getSessionCountdown(localSession.startTime, localSession.duration, localSession.status, nowTick),
    [localSession.startTime, localSession.duration, localSession.status, nowTick],
  );

  const spaceSubtitle = useMemo(() => {
    switch (localSession.status) {
      case "ONGOING":
        return "You're in session now. Stay present and gentle with yourself.";
      case "COMPLETED":
        return "This session is complete. Thank you for showing up for yourself.";
      case "CANCELLED":
        return "This session was cancelled.";
      case "MISSED":
        return "This session was marked as missed.";
      default:
        return "Your healing space is being prepared. Take a moment to breathe.";
    }
  }, [localSession.status]);

  const joinLabel = isParticipant ? "Join your Healer" : "Join session";

  const secureStatus = useMemo(() => {
    if (!localSession.meetingLink?.trim()) {
      return "● Meeting link will appear when your host shares it";
    }
    if (joinReady) {
      return "● Secure room is ready — you can join now";
    }
    if (localSession.status === "UPCOMING") {
      return "● Secure room opens 15 minutes before start";
    }
    if (localSession.status === "ONGOING") {
      return "● Session in progress";
    }
    return "● Session details";
  }, [joinReady, localSession.meetingLink, localSession.status]);

  const handleJoin = useCallback(() => {
    if (!localSession.meetingLink || !joinReady) return;
    window.open(localSession.meetingLink, "_blank", "noopener,noreferrer");
  }, [joinReady, localSession.meetingLink]);

  const canManageProviderLogistics =
    !!viewer &&
    (viewer.role === "ADMIN" || viewer.id === localSession.providerId);

  const providerLogisticsOpen =
    canManageProviderLogistics &&
    localSession.status !== "COMPLETED" &&
    localSession.status !== "CANCELLED" &&
    localSession.status !== "MISSED";

  const listenerFlowSession = isListenerSupportSession(localSession);

  const canRescheduleOrCancel =
    !!viewer &&
    (viewer.id === localSession.userId ||
      viewer.id === localSession.providerId ||
      viewer.role === "ADMIN") &&
    (localSession.status === "UPCOMING" || localSession.status === "ONGOING");

  const endTimePreviewMin = useMemo(() => {
    if (!providerLogisticsOpen || !listenerFlowSession) return null;
    const start = new Date(localSession.startTime).getTime();
    const end = new Date(sessionEndLocal).getTime();
    if (Number.isNaN(end)) return null;
    const raw = Math.round((end - start) / 60_000);
    return Math.max(1, Math.min(240, raw));
  }, [providerLogisticsOpen, listenerFlowSession, localSession.startTime, sessionEndLocal]);

  const saveProviderLogistics = () => {
    const link = draftMeetingLink.trim();
    if (link.length > 0) {
      try {
        new URL(link);
      } catch {
        setLogisticsError(
          "Enter a valid meeting URL, or clear the field to save without a link.",
        );
        return;
      }
    }
    setLogisticsError(null);
    patchSession.mutate({
      meetingLink: link.length > 0 ? link : "",
      notes: draftNotes.trim(),
      description: draftDescription.trim(),
    });
  };

  const markOngoing = () => {
    setLogisticsError(null);
    patchSession.mutate({ status: "ONGOING" });
  };

  const completeTherapistSession = () => {
    setLogisticsError(null);
    patchSession.mutate({ status: "COMPLETED" });
  };

  const completeListenerSession = () => {
    const end = new Date(sessionEndLocal);
    if (Number.isNaN(end.getTime())) {
      setLogisticsError("Choose a valid session end time.");
      return;
    }
    if (end.getTime() < new Date(localSession.startTime).getTime()) {
      setLogisticsError("End time cannot be before the scheduled start.");
      return;
    }
    setLogisticsError(null);
    patchSession.mutate({
      status: "COMPLETED",
      endedAt: end.toISOString(),
    });
  };

  const submitReschedule = () => {
    const nextStart = new Date(rescheduleStartLocal);
    if (Number.isNaN(nextStart.getTime())) {
      setLogisticsError("Choose a valid date and time.");
      return;
    }
    if (nextStart.getTime() <= Date.now()) {
      setLogisticsError("Pick a future date and time.");
      return;
    }
    setLogisticsError(null);
    patchSession.mutate({ startTime: nextStart.toISOString() });
  };

  const cancelSession = () => {
    setLogisticsError(null);
    patchSession.mutate({ status: "CANCELLED" });
  };

  const providerRoleLabel =
    localSession.sessionMode === "LISTENER"
      ? viewer?.role === "ADMIN"
        ? "Admin"
        : "Listener"
      : viewer?.role === "ADMIN"
        ? "Admin"
        : "Therapist";

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0d2f2a]/35 px-3 py-6 backdrop-blur-[6px] sm:px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: easeCalm }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="healing-space-title"
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[1.35rem] border border-white/40 bg-linear-to-br from-[#f4faf6] via-[#eef6f1] to-[#e6f0ea] p-4 shadow-[0_28px_80px_-24px_rgb(13_47_42/45%)] sm:p-6 md:p-8"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
          mass: 0.85,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2.5 text-text-primary/55 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-text-primary sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        <div className="space-y-7 lg:space-y-10">
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#2f745f]/80">
              Session details
            </p>
            <h2
              id="healing-space-title"
              className="mt-2 max-w-[22rem] font-display text-3xl font-semibold tracking-tight text-[#0d2f2a] sm:max-w-2xl sm:text-4xl"
            >
              Your Healing Space
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-primary/70 sm:text-base">
              {spaceSubtitle}
            </p>
          </motion.div>

          <div className="grid gap-8  lg:gap-x-10 lg:gap-y-6">
            <motion.div
              className="min-w-0 space-y-5"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
            <motion.div
              variants={itemVariants}
              className="rounded-[1.15rem] border border-white/70 bg-white/90 p-5 shadow-[0_12px_40px_-16px_rgb(13_47_42/18%)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start gap-4">
                <UserAvatarCircle
                  name={otherParty?.name}
                  email={otherParty?.email}
                  image={otherParty?.image ?? null}
                  className="h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24"
                  roundedClassName="rounded-2xl"
                  fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#9bc4ae] text-xl font-semibold text-[#0d2f2a]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-semibold text-text-primary sm:text-[1.65rem]">
                    {counterpartyName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-[#e8f4ee] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0f5147]">
                      {toSentenceCase(localSession.sessionMode)} session
                    </span>
                    <span className="inline-flex rounded-full bg-[#f2ede6] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-primary/70">
                      {toSentenceCase(localSession.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <SessionStat
                  icon={<CalendarIcon />}
                  label="Date"
                  value={formatShortDate(localSession.startTime)}
                />
                <SessionStat
                  icon={<ClockIcon />}
                  label="Time"
                  value={formatSessionClock(localSession.startTime)}
                />
                <SessionStat
                  icon={<HourglassIcon />}
                  label="Duration"
                  value={`${localSession.duration} mins`}
                />
              </div>

              {countdown ? (
                <div className="mt-8 space-y-1 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/50">
                    {countdown.primaryLabel}
                  </p>
                  <motion.p
                    key={countdown.scheduledDisplay}
                    initial={{ opacity: 0.35, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: easeCalm }}
                    className="font-display text-2xl font-semibold leading-snug tracking-tight text-[#0d2f2a] sm:text-3xl"
                  >
                    {countdown.scheduledDisplay}
                  </motion.p>
                  <motion.p
                    key={countdown.countdownLine}
                    initial={{ opacity: 0.45, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: easeCalm }}
                    className="pt-1 text-base font-semibold tabular-nums text-[#0f5147] sm:text-lg"
                  >
                    {countdown.countdownLine}
                  </motion.p>
                  <p className="pt-0.5 text-xs text-text-primary/55">{countdown.subline}</p>
                </div>
              ) : (
                <div className="mt-6 rounded-gentle bg-background/50 px-4 py-3 text-center text-sm text-text-primary/65">
                  {formatDateTime(localSession.startTime)} · {localSession.duration} mins ·{" "}
                  {toSentenceCase(localSession.status)}
                  {localSession.endTime ? (
                    <>
                      {" "}
                      · Ended {formatDateTime(localSession.endTime)}
                    </>
                  ) : null}
                </div>
              )}

              <p className="mt-4 text-center text-xs font-medium text-[#2f745f]/90">{secureStatus}</p>

              <div className="mt-6 space-y-3">
                <motion.button
                  type="button"
                  disabled={!joinReady}
                  onClick={handleJoin}
                  title={
                    joinReady
                      ? undefined
                      : localSession.meetingLink?.trim()
                        ? "The join button activates 15 minutes before start (and stays open until the session ends)."
                        : "Your host has not added a meeting link yet."
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#045b4f] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgb(4_91_79/55%)] transition disabled:cursor-not-allowed disabled:bg-text-primary/25 disabled:shadow-none"
                  whileHover={joinReady ? { scale: 1.01, y: -1 } : undefined}
                  whileTap={joinReady ? { scale: 0.99 } : undefined}
                  transition={hoverLiftTransition}
                >
                  <DoorIcon className="h-5 w-5 opacity-90" />
                  {joinReady ? joinLabel : "Join room"}
                </motion.button>

                <div className={viewer?.role === "USER" ? "" : "grid grid-cols-2 gap-2"}>
                  {viewer?.role !== "USER" && (
                    <button
                      type="button"
                      disabled={!canRescheduleOrCancel || patchSession.isPending}
                      onClick={() => {
                        setShowCancelConfirm(false);
                        setShowRescheduleForm((open) => !open);
                        setLogisticsError(null);
                      }}
                      title={
                        canRescheduleOrCancel
                          ? "Move this session to a new date and time"
                          : "Only upcoming or ongoing sessions can be rescheduled"
                      }
                      className="w-full rounded-xl bg-[#e8dcc8]/90 py-2.5 text-center text-xs font-semibold text-[#5c4a32] transition hover:bg-[#e0d2bc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showRescheduleForm ? "Hide reschedule" : "Reschedule"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!canRescheduleOrCancel || patchSession.isPending}
                    onClick={() => {
                      setShowRescheduleForm(false);
                      setShowCancelConfirm((open) => !open);
                      setLogisticsError(null);
                    }}
                    title={
                      canRescheduleOrCancel
                        ? "Cancel this session and release any held payment"
                        : "This session can no longer be cancelled"
                    }
                    className="w-full rounded-xl border border-[#cf4f45]/25 py-2.5 text-center text-xs font-semibold text-[#cf4f45] transition hover:bg-[#fff3f1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel session
                  </button>
                </div>

                {showRescheduleForm && canRescheduleOrCancel && viewer?.role !== "USER" ? (
                  <div className="rounded-xl border border-[#e8dcc8]/90 bg-[#faf6ef] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#5c4a32]">Choose a new start time</p>
                    <label className="block text-xs font-semibold text-text-primary/65">
                      New date & time
                      <input
                        type="datetime-local"
                        min={toDateTimeLocalValue(new Date(Date.now() + 60_000))}
                        value={rescheduleStartLocal}
                        onChange={(e) => setRescheduleStartLocal(e.target.value)}
                        className="mt-1.5 w-full max-w-xs rounded-lg border border-accent/80 bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                      />
                    </label>
                    <p className="text-[11px] leading-relaxed text-text-primary/60">
                      Members must cancel at least 24 hours before start. Providers and admins can
                      reschedule anytime while the session is still active.
                    </p>
                    <button
                      type="button"
                      disabled={patchSession.isPending}
                      onClick={submitReschedule}
                      className="rounded-full bg-[#5c4a32] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60"
                    >
                      {patchSession.isPending ? "Saving…" : "Confirm reschedule"}
                    </button>
                  </div>
                ) : null}

                {showCancelConfirm && canRescheduleOrCancel ? (
                  <div className="rounded-xl border border-[#cf4f45]/20 bg-[#fff7f6] p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#8b3a34]">Cancel this session?</p>
                    <p className="text-xs leading-relaxed text-text-primary/65">
                      Held wallet funds are released back to the member. Listener sessions that were
                      already paid are refunded. This cannot be undone.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={patchSession.isPending}
                        onClick={cancelSession}
                        className="rounded-full bg-[#cf4f45] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60"
                      >
                        {patchSession.isPending ? "Cancelling…" : "Yes, cancel session"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-full px-4 py-2 text-xs font-semibold text-text-primary/60"
                      >
                        Keep session
                      </button>
                    </div>
                  </div>
                ) : null}

                {logisticsError &&
                !providerLogisticsOpen &&
                !showRescheduleForm &&
                !showCancelConfirm ? (
                  <p className="text-xs font-semibold text-[#cf4f45]">{logisticsError}</p>
                ) : null}

                {providerLogisticsOpen ? (
                  <div className="mt-6 space-y-4 rounded-xl border border-[#c5e3d4]/80 bg-[#f8fcf9] p-4 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0f5147]/90">
                      {providerRoleLabel} · session logistics
                    </p>
                    <label className="block text-xs font-semibold text-text-primary/65">
                      Meeting link
                      <input
                        type="text"
                        inputMode="url"
                        value={draftMeetingLink}
                        onChange={(e) => setDraftMeetingLink(e.target.value)}
                        placeholder="https://…"
                        className="mt-1.5 w-full rounded-lg border border-accent/80 bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                        autoComplete="off"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-text-primary/65">
                      Session notes (visible to the member)
                      <textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="mt-1.5 w-full resize-y rounded-lg border border-accent/80 bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-text-primary/65">
                      Session description
                      <textarea
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="mt-1.5 w-full resize-y rounded-lg border border-accent/80 bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                      />
                    </label>
                    {logisticsError ? (
                      <p className="text-xs font-semibold text-[#cf4f45]">{logisticsError}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={patchSession.isPending}
                        onClick={saveProviderLogistics}
                        className="rounded-full bg-[#045b4f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
                      >
                        {patchSession.isPending ? "Saving…" : "Save details"}
                      </button>
                    </div>

                    <div className="border-t border-[#dceee3] pt-4 space-y-3">
                      <p className="text-xs font-semibold text-[#0f5147]">When the session ends</p>
                      {listenerFlowSession ? (
                        <p className="text-[11px] leading-relaxed text-text-primary/60">
                          Pick the real end time. We record duration from the scheduled start to this
                          time (up to 240 minutes) and pay out your share when you complete the
                          session.
                        </p>
                      ) : (
                        <p className="text-[11px] leading-relaxed text-text-primary/60">
                          Mark the session complete when you are done. Payment is captured from the
                          member&apos;s hold and your payout is released automatically.
                        </p>
                      )}
                      {localSession.status === "UPCOMING" ? (
                        <button
                          type="button"
                          disabled={patchSession.isPending}
                          onClick={markOngoing}
                          className="rounded-full border border-[#045b4f]/40 bg-white px-4 py-2 text-xs font-semibold text-[#045b4f] transition hover:bg-[#e8f4ee] disabled:opacity-60"
                        >
                          Mark as ongoing
                        </button>
                      ) : null}
                      {listenerFlowSession ? (
                        <>
                          <label className="block text-xs font-semibold text-text-primary/65">
                            Session ended at (your device time)
                            <input
                              type="datetime-local"
                              min={toDateTimeLocalValue(new Date(localSession.startTime))}
                              value={sessionEndLocal}
                              onChange={(e) => setSessionEndLocal(e.target.value)}
                              className="mt-1.5 w-full max-w-xs rounded-lg border border-accent/80 bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                            />
                          </label>
                          {endTimePreviewMin != null ? (
                            <p className="text-[11px] text-text-primary/65">
                              Recorded duration: about{" "}
                              <span className="font-semibold">{endTimePreviewMin}</span> minutes
                            </p>
                          ) : null}
                          <button
                            type="button"
                            disabled={patchSession.isPending}
                            onClick={completeListenerSession}
                            className="rounded-full bg-[#17313a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0f2529] disabled:opacity-60"
                          >
                            {patchSession.isPending ? "Updating…" : "Complete session & save duration"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={patchSession.isPending}
                          onClick={completeTherapistSession}
                          className="rounded-full bg-[#17313a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0f2529] disabled:opacity-60"
                        >
                          {patchSession.isPending ? "Updating…" : "Complete session"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>

            {!providerLogisticsOpen && localSession.notes ? (
              <motion.div
                variants={itemVariants}
                className="flex cursor-default items-center justify-between gap-3 rounded-[1rem] border border-[#c5e3d4]/80 bg-[#f0faf4] px-4 py-3.5 transition hover:border-[#9bc4ae]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d6ebe0] text-[#0f5147]">
                    <NotesIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0f5147]">Session notes</p>
                    <p className="truncate text-sm text-text-primary/70">{localSession.notes}</p>
                  </div>
                </div>
                <span className="shrink-0 text-text-primary/35" aria-hidden>
                  <ChevronRightIcon />
                </span>
              </motion.div>
            ) : null}

            {!providerLogisticsOpen && localSession.description ? (
              <motion.div
                variants={itemVariants}
                className="rounded-[1rem] border border-accent/50 bg-white/70 px-4 py-3 text-sm text-text-primary/75"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                  About this session
                </p>
                <p className="mt-1.5 leading-relaxed">{localSession.description}</p>
              </motion.div>
            ) : null}

            {completed && !viewerHasReviewed ? (
              <motion.div
                variants={itemVariants}
                className="rounded-[1rem] border border-[#bde2cf] bg-[#f6fbf7] px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f5147]">Share how it went</p>
                    <p className="text-xs text-text-primary/65">
                      Your feedback stays private and helps improve future sessions.
                    </p>
                  </div>
                  {!showReviewForm ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(true)}
                      className="rounded-full bg-[#045b4f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                    >
                      Leave a review
                    </button>
                  ) : null}
                </div>

                {showReviewForm ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <motion.button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          whileTap={{ scale: 0.92 }}
                          className={`h-9 w-9 rounded-full text-lg font-semibold transition ${
                            value <= rating
                              ? "bg-[#045b4f] text-white shadow-sm"
                              : "bg-white text-text-primary/60 ring-1 ring-accent"
                          }`}
                          aria-label={`Rate ${value} of 5`}
                        >
                          ★
                        </motion.button>
                      ))}
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Anything you'd like to share (optional)"
                      className="w-full rounded-calm border border-accent bg-white px-3 py-2 text-sm text-text-primary focus:border-[#045b4f] focus:outline-none"
                    />
                    {submitReview.error ? (
                      <p className="text-xs font-semibold text-[#cf4f45]">
                        {submitReview.error.message}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={rating === 0 || submitReview.isPending}
                        onClick={() => submitReview.mutate()}
                        className="rounded-full bg-[#045b4f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
                      >
                        {submitReview.isPending ? "Submitting..." : "Submit review"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="text-xs font-semibold text-text-primary/55"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : completed && viewerHasReviewed ? (
              <motion.p variants={itemVariants} className="text-xs font-semibold text-[#0f5147]">
                You&apos;ve already left a review for this session.
              </motion.p>
            ) : null}
            </motion.div>

            {/* <motion.aside
              className="relative flex min-w-0 shrink-0 flex-col gap-4 lg:border-l lg:border-[#dceee3]/80 lg:ps-6 lg:pt-0.5"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...morphTransition, delay: 0.12 }}
            >
            <div className="rounded-[1.1rem] border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[#0d2f2a]">
                <SparkleIcon className="h-5 w-5 text-[#2f745f]" />
                <p className="font-display text-lg font-semibold">Quick preparation</p>
              </div>
              <ol className="mt-4 space-y-4 text-sm leading-relaxed text-text-primary/75">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4ee] text-xs font-bold text-[#0f5147]">
                    1
                  </span>
                  <span>
                    <span className="font-semibold text-text-primary">Set the scene.</span> Find a
                    quiet, comfortable space where you won&apos;t be interrupted.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4ee] text-xs font-bold text-[#0f5147]">
                    2
                  </span>
                  <span>
                    <span className="font-semibold text-text-primary">Tech check.</span> Ensure your
                    camera and microphone are working if you plan to use them.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4ee] text-xs font-bold text-[#0f5147]">
                    3
                  </span>
                  <span>
                    <span className="font-semibold text-text-primary">Grounding.</span> Keep water
                    nearby and a notebook for reflections after the session.
                  </span>
                </li>
              </ol>
            </div>

            <motion.div
              className="relative overflow-hidden rounded-[1.1rem] border border-[#b8d4c4]/90 p-5 shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.22 }}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#1a4d3a]/25 via-[#2d6b52]/15 to-[#8fb5a0]/35"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgb(255 255 255 / 35%), transparent 45%), radial-gradient(circle at 80% 60%, rgb(180 220 200 / 40%), transparent 50%)",
                }}
                aria-hidden
              />
              <div className="relative">
                <p className="text-sm font-semibold leading-snug text-[#0d2f2a]">
                  Feeling anxious? Try a few slow breaths while you wait.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-primary/70">
                  Inhale for four counts, hold gently, then exhale for six. Repeat until you feel a
                  little steadier.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#045b4f] underline-offset-2 transition hover:underline"
                  onClick={() => setShowBreatheDetail((v) => !v)}
                  aria-expanded={showBreatheDetail}
                >
                  <PlayIcon className="h-4 w-4" />
                  {showBreatheDetail ? "Hide breathing tips" : "Breathe with me"}
                </button>
                <AnimatePresence initial={false}>
                  {showBreatheDetail ? (
                    <motion.div
                      key="breathe-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: easeCalm }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-xs leading-relaxed text-text-primary/75">
                        Sit tall, soften your shoulders, and let your next exhale be a little longer
                        than your inhale. Even two minutes helps your nervous system settle.
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.aside> */}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SessionStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f4faf6] px-3 py-3 ring-1 ring-[#dceee3]/90">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f745f] shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5l3 1.5" strokeLinecap="round" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 3h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V3zM8 21h8v-3a4 4 0 0 0-4-4 4 4 0 0 0-4 4v3z" />
      <path d="M9 12h6" strokeLinecap="round" />
    </svg>
  );
}

function DoorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4h10a2 2 0 0 1 2 2v16H6V4z" />
      <circle cx="14" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 4h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3v4M12 17v4M5 12h4M15 12h4" strokeLinecap="round" />
      <path d="M12 12h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
