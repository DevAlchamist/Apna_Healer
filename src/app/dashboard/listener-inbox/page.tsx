"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FadeIn, hoverLiftTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  displayAccountLabel,
  formatSentAgo,
  formatShortDate,
  isCareSessionJoinWindowOpen,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiCareSession, ApiUser } from "@/types/api";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { SessionCardSkeleton, SessionRowSkeleton } from "@/components/skeletons";
import { useThemePalette } from "@/hooks/use-theme-palette";

type InboxRequest = {
  id: string;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  emotionalTags: string[];
  preferredTone: string | null;
  preferredLanguage: string | null;
  note: string | null;
  status: "PENDING" | "ASSIGNED" | "APPROVED" | "DECLINED" | "EXPIRED";
  listenerConfirmation: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  session: { id: string; status: string; startTime?: string } | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeRange24(startIso: string, durationMin: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const f = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${f(start)} – ${f(end)}`;
}

function formatWeekdayLong(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(d);
}

function formatMonthDay(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
  }).format(d);
}

function sessionCardTitle(s: ApiCareSession): string {
  const raw = s.description?.trim();
  if (raw) {
    const line = raw.split(/[.·\n]/)[0]?.trim() ?? raw;
    return line.length > 52 ? `${line.slice(0, 51)}…` : line;
  }
  return "Deep listening session";
}

function sessionWithLabel(
  sessionItem: ApiCareSession,
  viewerId?: string,
): string {
  const name = sessionCounterpartyLabel(sessionItem, viewerId);
  return `Session with ${name}`;
}

function memberSubtitle(row: InboxRequest): string {
  const tags = row.emotionalTags ?? [];
  if (tags.length > 0) return tags.slice(0, 2).join(" · ");
  return "First-time session";
}

function notePreview(note: string | null, max = 220): string | null {
  if (!note?.trim()) return null;
  const t = note.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesUntilStart(startIso: string, nowMs: number): number {
  return Math.round((new Date(startIso).getTime() - nowMs) / 60_000);
}

function formatInMinutesUpper(startIso: string, nowMs: number): string | null {
  const m = minutesUntilStart(startIso, nowMs);
  if (m > 0 && m <= 120) return `IN ${m} MINUTES`;
  return null;
}

function formatCompactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-IN");
}

function computeActiveStreakDays(
  sessions: ApiCareSession[],
  nowMs: number,
): number {
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const dayKeys = new Set<string>();
  for (const s of completed) {
    const d = new Date(s.startTime);
    dayKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  let streak = 0;
  const today = new Date(nowMs);
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dayKeys.has(key)) streak += 1;
    else break;
  }
  return streak;
}

function requestBadge(row: InboxRequest): "New Member" | "Returning Soul" {
  const created = new Date(row.createdAt).getTime();
  const ageDays = (Date.now() - created) / (24 * 60 * 60 * 1000);
  return ageDays > 14 ? "Returning Soul" : "New Member";
}

function featuredSessionIndex(
  sessions: ApiCareSession[],
  nowMs: number,
): number {
  const on = sessions.findIndex((s) => s.status === "ONGOING");
  if (on >= 0) return on;
  const soon = sessions.findIndex((s) => {
    const m = minutesUntilStart(s.startTime, nowMs);
    return m > 0 && m <= 120;
  });
  if (soon >= 0) return soon;
  return 0;
}

export default function ListenerInboxPage() {
  const { forest: FOREST, mint: MINT, peach: PEACH, beige: BEIGE } = useThemePalette();
  const queryClient = useQueryClient();
  const { open: openSessionDetails } = useSessionDetailsModal();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const inboxQuery = useQuery({
    queryKey: ["listener-inbox"],
    queryFn: () =>
      apiFetch<InboxRequest[]>("/api/listener-requests?scope=listening"),
  });

  const sessionsQuery = useQuery({
    queryKey: ["listener-inbox-sessions"],
    queryFn: () =>
      apiFetch<ApiCareSession[]>("/api/sessions?scope=provider&take=100"),
    enabled: userQuery.data?.role === "LISTENER",
  });

  const respondMutation = useMutation({
    mutationFn: (input: { id: string; decision: "accept" | "decline" }) =>
      apiMutation<InboxRequest>(
        `/api/listener-requests/${input.id}/listener-response`,
        "POST",
        { decision: input.decision },
      ),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      queryClient.invalidateQueries({ queryKey: ["listener-inbox"] });
    },
  });

  const user = userQuery.data;
  const rows = inboxQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];

  const upcomingSessions = useMemo(() => {
    const rank = (s: ApiCareSession) =>
      s.status === "ONGOING" ? 0 : s.status === "UPCOMING" ? 1 : 2;
    return [...sessions]
      .filter((s) => s.status === "UPCOMING" || s.status === "ONGOING")
      .sort((a, b) => {
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });
  }, [sessions]);

  const completedCount = useMemo(
    () => sessions.filter((s) => s.status === "COMPLETED").length,
    [sessions],
  );

  const soulsSupported =
    user?.listenerProfile?.totalSessions != null
      ? user.listenerProfile.totalSessions
      : completedCount;

  const listenedMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "COMPLETED")
        .reduce((acc, s) => acc + (s.duration ?? 0), 0),
    [sessions],
  );

  const streakDays = useMemo(
    () => computeActiveStreakDays(sessions, nowTick),
    [sessions, nowTick],
  );

  const pendingRows = useMemo(
    () =>
      rows.filter(
        (r) => r.status === "ASSIGNED" && r.listenerConfirmation === "PENDING",
      ),
    [rows],
  );

  const otherRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          !(r.status === "ASSIGNED" && r.listenerConfirmation === "PENDING"),
      ),
    [rows],
  );

  const pageError = inboxQuery.error?.message ?? sessionsQuery.error?.message;

  const today = useMemo(() => new Date(nowTick), [nowTick]);
  const headlineDay = `${formatWeekdayLong(today)}, ${formatMonthDay(today)}`;
  const featuredIdx = useMemo(
    () => featuredSessionIndex(upcomingSessions, nowTick),
    [upcomingSessions, nowTick],
  );

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    },
  } as const;

  return (
    <FadeIn className="space-y-8 md:space-y-10">
      {pageError ? (
        <div className="rounded-calm border border-[#cf4f45]/25 bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-soft">
          {pageError}
        </div>
      ) : null}

      <div className=" w-full max-w-auto rounded-calm border border-accent/80 bg-[#fdfbf7] p-5 shadow-soft sm:p-6 md:p-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Main column: header + pending (first on mobile) */}
          <div className="order-1 space-y-8 lg:order-2 lg:col-span-8">
            <header className="space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <h1
                    className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
                    style={{ color: FOREST }}
                  >
                    Your Daily Flow
                  </h1>
                  <p className="max-w-xl text-sm leading-relaxed text-[#5c5c5c] sm:text-[15px]">
                    {headlineDay} — A day for gentle guidance.
                  </p>
                </div>

                <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                  <BlobStat
                    background={MINT}
                    label="Souls supported"
                    value={formatCompactCount(soulsSupported)}
                  />
                  <BlobStat
                    background={PEACH}
                    label="Minutes listened"
                    value={formatCompactCount(listenedMinutes)}
                  />
                  <StreakCard days={streakDays} />
                </div>
              </div>
            </header>

            <section id="pending-connections" className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h2
                  className="font-display text-xl font-semibold tracking-tight sm:text-2xl"
                  style={{ color: FOREST }}
                >
                  Pending Connections
                </h2>
                <Link
                  href="#pending-connections"
                  className="shrink-0 text-xs font-semibold underline-offset-4 transition hover:underline sm:text-sm"
                  style={{ color: FOREST }}
                >
                  View all ({pendingRows.length})
                </Link>
              </div>

              {inboxQuery.isLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <SessionCardSkeleton key={i} />
                  ))}
                </div>
              ) : pendingRows.length === 0 ? (
                <div
                  className="rounded-[22px] border border-[#2D5A4C]/10 px-5 py-8 text-center text-sm leading-relaxed text-[#6b6b6b]"
                  style={{ backgroundColor: `${BEIGE}99` }}
                >
                  You&apos;re all caught up. New assignments will appear here
                  when admin routes a request to you.
                </div>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  <AnimatePresence mode="popLayout">
                    {pendingRows.map((row) => {
                      const displayName = row.user
                        ? displayAccountLabel(row.user.name, row.user.email)
                        : "Member";
                      const preview = notePreview(row.note);
                      const busy =
                        respondMutation.isPending && pendingId === row.id;
                      const badge = requestBadge(row);

                      return (
                        <motion.article
                          key={row.id}
                          layout
                          variants={itemVariants}
                          initial="hidden"
                          animate="show"
                          exit={{
                            opacity: 0,
                            x: -24,
                            transition: { duration: 0.2 },
                          }}
                          className="rounded-[22px] bg-white p-5 shadow-[0_12px_40px_-18px_rgba(45,90,76,0.18)] ring-1 ring-[#2D5A4C]/[0.06] sm:p-6"
                          whileHover={{
                            y: -2,
                            transition: hoverLiftTransition,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <UserAvatarCircle
                              name={row.user?.name}
                              email={row.user?.email}
                              image={row.user?.image ?? null}
                              className="h-12 w-12 shrink-0"
                              fallbackClassName="bg-linear-to-br from-[#2D5A4C] to-[#4a8a72] text-sm font-semibold text-white"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-lg font-semibold leading-tight text-[#1a1a1a]">
                                  {displayName}
                                </p>
                                <span
                                  className="shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#5c5c5c] ring-1 ring-black/[0.06]"
                                  style={{ backgroundColor: BEIGE }}
                                >
                                  {badge}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-[#7a7a7a]">
                                {memberSubtitle(row)}
                              </p>
                            </div>
                          </div>

                          {preview ? (
                            <blockquote
                              className="mt-4 border-l-2 pl-4 text-sm italic leading-relaxed text-[#4a4a4a] sm:text-[15px]"
                              style={{ borderColor: MINT }}
                            >
                              &ldquo;{preview}&rdquo;
                            </blockquote>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-[#7a7a7a]">
                            <span>
                              {formatShortDate(new Date(row.preferredDate))} ·{" "}
                              {row.duration} min slot
                            </span>
                            <span>{formatSentAgo(row.createdAt)}</span>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <motion.button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                respondMutation.mutate({
                                  id: row.id,
                                  decision: "accept",
                                })
                              }
                              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(45,90,76,0.55)] transition disabled:opacity-50"
                              style={{ backgroundColor: FOREST }}
                              whileHover={{ scale: busy ? 1 : 1.02 }}
                              whileTap={{ scale: busy ? 1 : 0.98 }}
                            >
                              Accept request
                            </motion.button>
                            <motion.button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                respondMutation.mutate({
                                  id: row.id,
                                  decision: "decline",
                                })
                              }
                              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-[#2a2a2a] ring-1 ring-black/[0.08] transition hover:bg-white/80 disabled:opacity-50"
                              style={{ backgroundColor: BEIGE }}
                              whileHover={{ scale: busy ? 1 : 1.02 }}
                              whileTap={{ scale: busy ? 1 : 0.98 }}
                            >
                              Decline
                            </motion.button>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                  {respondMutation.isError ? (
                    <p className="text-xs font-semibold text-theme-status-error">
                      {respondMutation.error.message}
                    </p>
                  ) : null}
                </motion.div>
              )}

              {otherRows.length > 0 ? (
                <div
                  className="rounded-[18px] border border-[#2D5A4C]/10 px-4 py-3"
                  style={{ backgroundColor: `${BEIGE}80` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7a7a]">
                    Other assignments
                  </p>
                  <ul className="mt-2 space-y-2">
                    {otherRows.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5c5c5c]"
                      >
                        <span>
                          {formatShortDate(new Date(row.preferredDate))}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className="font-semibold"
                            style={{ color: FOREST }}
                          >
                            {row.status === "APPROVED"
                              ? "Approved"
                              : row.listenerConfirmation === "ACCEPTED"
                                ? "Awaiting admin"
                                : toSentenceCase(row.status)}
                          </span>
                          {row.status === "APPROVED" && row.session ? (
                            <button
                              type="button"
                              onClick={() => {
                                const sessionId = row.session?.id;
                                if (!sessionId) return;
                                void (async () => {
                                  const detail = await apiFetch<ApiCareSession>(
                                    `/api/sessions/${sessionId}`,
                                  );
                                  openSessionDetails(detail);
                                })();
                              }}
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-[#2D5A4C]/20 transition hover:bg-white/90"
                              style={{ color: FOREST }}
                            >
                              Session
                            </button>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>

          {/* Timeline column */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            <h2
              className="mb-5 font-display text-lg font-semibold sm:text-xl"
              style={{ color: FOREST }}
            >
              Today&apos;s rhythm
            </h2>

            {sessionsQuery.isLoading ? (
              <div className="space-y-4 pl-2">
                {[0, 1].map((i) => (
                  <SessionRowSkeleton key={i} />
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div
                className="rounded-[20px] border border-dashed border-[#2D5A4C]/20 px-4 py-6 text-center text-sm text-[#6b6b6b]"
                style={{ backgroundColor: `${BEIGE}66` }}
              >
                No sessions on your calendar yet. When admin approves a match,
                it will show on this timeline.
              </div>
            ) : (
              <div className="relative pl-1">
                <div
                  className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-[#2D5A4C]/25 via-[#2D5A4C]/15 to-transparent"
                  aria-hidden
                />
                <ul className="space-y-5">
                  {upcomingSessions.map((sessionItem, index) => {
                    const isFeatured = index === featuredIdx;
                    const joinReady =
                      !!sessionItem.meetingLink?.trim() &&
                      isCareSessionJoinWindowOpen(
                        sessionItem,
                        new Date(nowTick),
                      );
                    const inMin = formatInMinutesUpper(
                      sessionItem.startTime,
                      nowTick,
                    );
                    const range = formatTimeRange24(
                      sessionItem.startTime,
                      sessionItem.duration,
                    );
                    const title = sessionCardTitle(sessionItem);
                    const withLine = sessionWithLabel(sessionItem, user?.id);

                    return (
                      <li
                        key={sessionItem.id}
                        className="relative flex gap-4 pl-1"
                      >
                        <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-5">
                          <span
                            className="h-3.5 w-3.5 rounded-full ring-4 ring-[#FDFBF7]"
                            style={{
                              backgroundColor: isFeatured ? FOREST : "#c8c4bc",
                              boxShadow: isFeatured
                                ? `0 0 0 4px ${MINT}99`
                                : undefined,
                            }}
                          />
                        </div>
                        <motion.article
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.35 }}
                          className={`min-w-0 flex-1 rounded-[20px] p-4 sm:p-5 ${
                            isFeatured
                              ? "bg-white shadow-[0_16px_48px_-20px_rgba(45,90,76,0.35)] ring-1 ring-[#2D5A4C]/[0.08]"
                              : "bg-white/45 ring-1 ring-[#2D5A4C]/[0.05]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {inMin && isFeatured ? (
                              <p
                                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                                style={{ color: FOREST }}
                              >
                                {inMin}
                              </p>
                            ) : (
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9a94]">
                                {sessionItem.status === "ONGOING"
                                  ? "Live now"
                                  : "Upcoming"}
                              </p>
                            )}
                            <p className="text-xs font-semibold tabular-nums text-[#6b6b6b]">
                              {range}
                            </p>
                          </div>
                          <p
                            className={`mt-2 font-display text-base font-semibold leading-snug sm:text-lg ${isFeatured ? "text-[#1a1a1a]" : "text-[#6b6b6b]"}`}
                          >
                            {title}
                          </p>
                          <div
                            className={`mt-3 flex items-center gap-2 ${isFeatured ? "text-[#4a4a4a]" : "text-[#8a8a84]"}`}
                          >
                            <UserAvatarCircle
                              name={sessionItem.user?.name}
                              email={sessionItem.user?.email}
                              image={sessionItem.user?.image ?? null}
                              className="h-8 w-8 shrink-0"
                              fallbackClassName={
                                isFeatured
                                  ? "bg-linear-to-br from-[#2D5A4C] to-[#5a9d82] text-[10px] text-white"
                                  : "bg-[#e8e6e1] text-[10px] font-semibold text-[#5c5c5c]"
                              }
                            />
                            <p className="text-sm font-medium">{withLine}</p>
                          </div>
                          {isFeatured &&
                          joinReady &&
                          sessionItem.meetingLink ? (
                            <motion.a
                              href={sessionItem.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-md transition"
                              style={{ backgroundColor: FOREST }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <PlayTriangleIcon className="h-4 w-4 text-white/95" />
                              Join virtual atrium
                            </motion.a>
                          ) : isFeatured ? (
                            <motion.button
                              type="button"
                              onClick={() => openSessionDetails(sessionItem)}
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-md transition"
                              style={{ backgroundColor: FOREST }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <PlayTriangleIcon className="h-4 w-4 text-white/95" />
                              Prepare session
                            </motion.button>
                          ) : null}
                          {!isFeatured ? (
                            <p className="mt-3 text-right text-xs font-medium tabular-nums text-[#9a9a94]">
                              {new Intl.DateTimeFormat("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(sessionItem.startTime))}
                            </p>
                          ) : null}
                          {isFeatured ? (
                            <button
                              type="button"
                              onClick={() => openSessionDetails(sessionItem)}
                              className="mt-2 w-full text-center text-xs font-semibold underline-offset-2 hover:underline"
                              style={{ color: FOREST }}
                            >
                              View details
                            </button>
                          ) : null}
                        </motion.article>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function BlobStat({
  background,
  label,
  value,
}: {
  background: string;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      className="relative flex min-h-[5.5rem] min-w-[7.5rem] flex-col justify-center overflow-hidden px-4 py-3 sm:min-w-[8.25rem]"
      style={{
        backgroundColor: background,
        borderRadius: "58% 42% 62% 38% / 48% 55% 45% 52%",
        boxShadow: "0 10px 28px -14px rgba(45, 90, 76, 0.25)",
      }}
      whileHover={{ y: -2, transition: hoverLiftTransition }}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d3d3d]/80">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-[#1a1a1a] sm:text-[1.65rem]">
        {value}
      </p>
    </motion.div>
  );
}

function StreakCard({ days }: { days: number }) {
  return (
    <motion.div
      className="flex min-h-[5.5rem] min-w-[9rem] flex-col justify-center rounded-[18px] bg-white px-4 py-3 shadow-[0_10px_28px_-14px_rgba(45,90,76,0.18)] ring-1 ring-[#2D5A4C]/[0.07]"
      whileHover={{ y: -2, transition: hoverLiftTransition }}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7a7a7a]">
        Growth streak
      </p>
      <div className="mt-1 flex items-center gap-2">
        <StreakLoopIcon className="h-8 w-8 shrink-0 text-[#2D5A4C]/85" />
        <div>
          <p className="font-display text-xl font-semibold leading-none text-[#1a1a1a]">
            {days}
          </p>
          <p className="text-[11px] font-medium text-[#6b6b6b]">days active</p>
        </div>
      </div>
    </motion.div>
  );
}

function PlayTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M9 6.5v11l9-5.5L9 6.5Z" />
    </svg>
  );
}

function StreakLoopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path
        d="M8 18c0-4.5 3.5-8 8-8 2.2 0 4.2.9 5.6 2.3M24 14c0 4.5-3.5 8-8 8-2.2 0-4.2-.9-5.6-2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 8v4h-4M10 24v-4h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
