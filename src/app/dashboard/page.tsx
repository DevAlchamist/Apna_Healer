"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { useListenerSupportModal } from "@/components/dashboard/listener-support-modal";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";
import { WelcomeBonusModal } from "@/components/dashboard/welcome-bonus-modal";
import { WeeklyMoodTrend } from "@/components/dashboard/weekly-mood-trend";
import {
  FadeIn,
  hoverLiftTransition,
  morphTransition,
} from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import {
  formatDateTime,
  getInitials,
  isCareSessionJoinWindowOpen,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiCareSession, ApiDailyQuote, ApiProvider, ApiUser } from "@/types/api";
import { ProviderRowSkeleton, QuoteBlockSkeleton } from "@/components/skeletons";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { open: openBookSession } = useBookSessionModal();
  const { open: openListenerSupport } = useListenerSupportModal();
  const { open: openSessionDetails } = useSessionDetailsModal();
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });
  const welcomeBonus = userQuery.data?.welcomeBonus;
  const showWelcomeBonusModal = !!welcomeBonus?.available;
  const sessionsQuery = useQuery({
    queryKey: ["dashboard-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?take=20"),
  });
  const listenersQuery = useQuery({
    queryKey: ["dashboard-listeners"],
    queryFn: () =>
      apiFetch<ApiProvider[]>("/api/providers?role=LISTENER&take=12"),
  });
  const quoteQuery = useQuery({
    queryKey: ["daily-quote"],
    queryFn: () => apiFetch<ApiDailyQuote>("/api/daily-quote"),
    staleTime: 5 * 60 * 1000,
  });

  const user = userQuery.data;
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const listeners = listenersQuery.data ?? [];
  const listenersPreview = listeners.slice(0, 4);
  const hasUpcomingOrOngoing = useMemo(
    () =>
      sessions.some(
        (session) => session.status === "ONGOING" || session.status === "UPCOMING",
      ),
    [sessions],
  );

  /** Prefer live / upcoming; only surface a past session when nothing active is scheduled. */
  const highlightSession = useMemo(() => {
    if (!sessions.length) return null;
    const ongoing = sessions.find((session) => session.status === "ONGOING");
    if (ongoing) return ongoing;
    const upcoming = sessions.find((session) => session.status === "UPCOMING");
    if (upcoming) return upcoming;
    return [...sessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )[0];
  }, [sessions]);

  const heroShowsPastOnly = Boolean(
    highlightSession &&
      highlightSession.status !== "ONGOING" &&
      highlightSession.status !== "UPCOMING",
  );

  const orderedSessions = useMemo(() => {
    const rank = (session: ApiCareSession) =>
      session.status === "ONGOING" ? 0 : session.status === "UPCOMING" ? 1 : 2;
    const sorted = [...sessions].sort((a, b) => {
      const delta = rank(a) - rank(b);
      if (delta !== 0) return delta;
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
    if (hasUpcomingOrOngoing) {
      return sorted.filter((session) => session.status !== "COMPLETED");
    }
    return sorted;
  }, [sessions, hasUpcomingOrOngoing]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      setNowTick(Date.now());
    });
  }, [highlightSession?.id, highlightSession?.status]);

  const joinWindowOpen =
    !!highlightSession &&
    isCareSessionJoinWindowOpen(highlightSession, new Date(nowTick));

  const queryError =
    userQuery.error?.message ??
    sessionsQuery.error?.message ??
    quoteQuery.error?.message;

  return (
    <FadeIn className="space-y-6">
      <WelcomeBonusModal
        open={showWelcomeBonusModal}
        amount={welcomeBonus?.amount ?? 100}
        userName={user?.name}
      />

      {queryError ? (
        <p className="rounded-calm bg-white px-4 py-3 text-sm font-medium text-[#cf4f45] shadow-soft">
          {queryError}
        </p>
      ) : null}

      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/45">
              Live Listeners Online
            </p>
            <p className="mt-1 text-xs text-text-primary/55">
              Anonymous peer support, matched after a quick check-in.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1f8a6e]">
              <motion.span
                className="inline-block h-2 w-2 rounded-full bg-[#22c997]"
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <span>{listeners.length} Available Now</span>
            </div>
            <motion.button
              type="button"
              onClick={() => openListenerSupport()}
              className="rounded-full bg-[#045b4f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverLiftTransition}
            >
              Talk to a Listener
            </motion.button>
          </div>
        </div>

        {listenersQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-calm border border-accent/70 bg-white px-3 py-3 shadow-soft"
              >
                <ProviderRowSkeleton />
              </div>
            ))}
          </div>
        ) : listenersPreview.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {listenersPreview.map((listener, index) => {
              const specialty =
                listener.languages[0] ??
                listener.specializations[0] ??
                "Peer support";

              return (
                <motion.button
                  key={listener.id}
                  type="button"
                  onClick={() => openListenerSupport()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...morphTransition, delay: 0.06 + index * 0.04 }}
                  whileHover={{ y: -3, transition: hoverLiftTransition }}
                  className="flex items-center gap-3 rounded-calm border border-accent/70 bg-white px-3 py-3 text-left shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/30 hover:shadow-soft-hover"
                >
                  <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f4ee] text-sm font-semibold text-text-secondary">
                    {listener.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listener.image}
                        alt={listener.name ?? "Listener"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(listener.name)}</span>
                    )}
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c997]"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {listener.name ?? "Verified listener"}
                    </p>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/55">
                      {specialty}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-calm border border-accent/70 bg-white px-4 py-3 text-sm text-text-primary/60 shadow-soft">
            No listeners are online right now. Check back in a little while.
          </div>
        )}
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <motion.section
          className="rounded-calm bg-linear-to-r from-[#d6e7df] to-[#bde2cf] p-6 shadow-soft transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover md:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.08 }}
          whileHover={{ y: -5, transition: hoverLiftTransition }}
        >
          <p className="inline-flex rounded-full bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {highlightSession
              ? highlightSession.status === "ONGOING"
                ? "Live session"
                : highlightSession.status === "UPCOMING"
                  ? "Upcoming session"
                  : "Your latest session"
              : "Upcoming session"}
          </p>
          <h1 className="mt-5 whitespace-pre-line font-display text-5xl font-semibold leading-[1.05] text-[#0d2f2a] md:text-6xl">
            {highlightSession
              ? `Session with\n${sessionCounterpartyLabel(highlightSession, user?.id)}`
              : "No session\nscheduled yet"}
          </h1>
          <p className="mt-4 whitespace-pre-line text-lg text-[#1b6054]">
            {highlightSession
              ? `${toSentenceCase(highlightSession.sessionMode)} support • ${toSentenceCase(
                  highlightSession.status,
                )}`
              : "Top up your wallet and book your first session when you're ready."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <p className="text-sm font-semibold text-[#0f5147]">
                {highlightSession
                  ? formatDateTime(highlightSession.startTime)
                  : "No date yet"}
              </p>
              <p className="text-sm font-semibold text-[#0f5147]">
                {highlightSession
                  ? `${highlightSession.duration} mins`
                  : "Book when ready"}
              </p>
            </div>
            {highlightSession ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {joinWindowOpen && highlightSession.meetingLink ? (
                  <motion.a
                    href={highlightSession.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#045b4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={hoverLiftTransition}
                  >
                    {user?.id === highlightSession.userId
                      ? "Join your Healer"
                      : "Join session"}
                  </motion.a>
                ) : null}
                {heroShowsPastOnly ? (
                  <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} transition={hoverLiftTransition}>
                    <Link
                      href="/dashboard/profile#healing-progress"
                      className="inline-flex rounded-full bg-[#045b4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                    >
                      See your Healing progress
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => openSessionDetails(highlightSession)}
                    className={
                      joinWindowOpen && highlightSession.meetingLink
                        ? "rounded-full border border-[#045b4f]/45 bg-white/75 px-6 py-3 text-sm font-semibold text-[#045b4f] shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white"
                        : "rounded-full bg-[#045b4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                    }
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={hoverLiftTransition}
                  >
                    See details
                  </motion.button>
                )}
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={() => openBookSession()}
                className="rounded-full bg-[#045b4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={hoverLiftTransition}
              >
                Book Session
              </motion.button>
            )}
          </div>
        </motion.section>

        <motion.section
          className="rounded-calm border border-[#c5ddd0]/90 bg-linear-to-br from-[#f0faf4] via-[#e8f5ee] to-[#dff0e8] p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[#9bc4ae] hover:shadow-soft-hover md:p-7"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.12 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2f745f]/75">
                Daily reflection
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#0d2f2a] md:text-3xl">
                Today&apos;s quote
              </h2>
            </div>
            <span
              className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#2f745f]/80 ring-1 ring-[#b8d4c4]/80"
              title="Calendar day (Asia/Kolkata) used to pick this quote"
            >
              {quoteQuery.data?.dateKey ? `IST ${quoteQuery.data.dateKey}` : "—"}
            </span>
          </div>

          <div className="relative mt-5 rounded-gentle bg-white/75 p-5 shadow-sm ring-1 ring-white/80">
            <span
              className="absolute left-3 top-2 font-display text-5xl leading-none text-[#045b4f]/15"
              aria-hidden
            >
              &ldquo;
            </span>
            {quoteQuery.isLoading ? (
              <QuoteBlockSkeleton />
            ) : quoteQuery.data ? (
              <blockquote className="relative pl-6">
                <p className="text-[1.05rem] font-medium leading-relaxed text-text-primary md:text-lg">
                  {quoteQuery.data.text}
                </p>
                {quoteQuery.data.author ? (
                  <footer className="mt-4 text-sm font-semibold text-[#2f745f]">
                    — {quoteQuery.data.author}
                  </footer>
                ) : (
                  <footer className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-text-primary/40">
                    Apna Healer
                  </footer>
                )}
              </blockquote>
            ) : (
              <p className="relative pl-6 text-sm text-text-primary/55">No quote available right now.</p>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-text-primary/55">
            A new line is chosen for everyone each day at midnight India time, from our curated
            collection.
          </p>
        </motion.section>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.14 }}
        >
          <WeeklyMoodTrend />
        </motion.div>

        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.18 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Session Timeline
            </h2>
            <span className="text-sm font-semibold text-text-secondary">
              {orderedSessions.length} shown
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {orderedSessions.length > 0 ? (
              orderedSessions.map((session, index) => (
                <motion.button
                  key={session.id}
                  type="button"
                  onClick={() => openSessionDetails(session)}
                  className="space-y-2 rounded-gentle bg-background p-4 text-left transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:bg-accent/35 hover:shadow-sm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...morphTransition,
                    delay: 0.22 + index * 0.06,
                  }}
                  whileHover={{ y: -3, transition: hoverLiftTransition }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl font-semibold text-text-primary">
                      {sessionCounterpartyLabel(session, user?.id)}
                    </p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-text-secondary">
                      {toSentenceCase(session.status)}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary/60">
                    {toSentenceCase(session.sessionMode)} • {session.duration}{" "}
                    mins
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-primary/45">
                    {formatDateTime(session.startTime)}
                  </p>
                </motion.button>
              ))
            ) : (
              <div className="rounded-gentle bg-background px-4 py-4 text-sm text-text-primary/58">
                Once a booking is accepted, your live session timeline will
                appear here.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </FadeIn>
  );
}
