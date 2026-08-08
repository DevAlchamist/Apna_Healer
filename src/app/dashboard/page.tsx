"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiFetch, apiMutation } from "@/lib/api-client";
import {
  formatCurrency,
  formatDateTime,
  getInitials,
  isCareSessionJoinWindowOpen,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiCareSession, ApiDailyQuote, ApiProvider, ApiUser } from "@/types/api";
import { ProviderRowSkeleton, QuoteBlockSkeleton } from "@/components/skeletons";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { open: openBookSession } = useBookSessionModal();
  const { open: openListenerSupport } = useListenerSupportModal();
  const { open: openSessionDetails } = useSessionDetailsModal();

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });
  const welcomeBonus = userQuery.data?.welcomeBonus;
  const role = userQuery.data?.role ?? "USER";
  const showWelcomeBonusModal = !!welcomeBonus?.available && role === "USER";

  const sessionsQuery = useQuery({
    queryKey: ["dashboard-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?take=20"),
  });

  const listenersQuery = useQuery({
    queryKey: ["dashboard-listeners"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?role=LISTENER&take=12"),
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

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const highlightSession = useMemo(() => {
    if (!sessions.length) return null;
    const activeSessions = sessions.filter(
      (s) => s.status === "ONGOING" || s.status === "UPCOMING",
    );
    if (activeSessions.length > 0) {
      const sorted = [...activeSessions].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      const ongoing = sorted.find((s) => s.status === "ONGOING");
      return ongoing ?? sorted[0];
    }
    return [...sessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )[0] ?? null;
  }, [sessions]);

  const joinWindowOpen =
    !!highlightSession &&
    isCareSessionJoinWindowOpen(highlightSession, new Date(nowTick));

  const queryError =
    userQuery.error?.message ??
    sessionsQuery.error?.message ??
    quoteQuery.error?.message;

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6">
      {role === "USER" && (
        <WelcomeBonusModal
          open={showWelcomeBonusModal}
          amount={welcomeBonus?.amount ?? 100}
          userName={user?.name}
        />
      )}

      {queryError ? (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-theme-status-error shadow-soft">
          {queryError}
        </p>
      ) : null}

      {role === "USER" && (
        <UserDashboardHome
          user={user}
          sessions={sessions}
          listeners={listeners}
          listenersPreview={listenersPreview}
          listenersQuery={listenersQuery}
          highlightSession={highlightSession}
          joinWindowOpen={joinWindowOpen}
          openBookSession={openBookSession}
          openListenerSupport={openListenerSupport}
          openSessionDetails={openSessionDetails}
          quoteQuery={quoteQuery}
        />
      )}

      {role === "THERAPIST" && (
        <TherapistDashboardHome
          user={user}
          sessions={sessions}
          highlightSession={highlightSession}
          joinWindowOpen={joinWindowOpen}
          openSessionDetails={openSessionDetails}
          quoteQuery={quoteQuery}
        />
      )}

      {role === "LISTENER" && (
        <ListenerDashboardHome
          user={user}
          sessions={sessions}
          highlightSession={highlightSession}
          joinWindowOpen={joinWindowOpen}
          openSessionDetails={openSessionDetails}
          quoteQuery={quoteQuery}
        />
      )}
    </FadeIn>
  );
}

/* ==========================================
   1. USER DASHBOARD (Mental Wellness Companion)
   ========================================== */
function UserDashboardHome({
  user,
  sessions,
  listeners,
  listenersPreview,
  listenersQuery,
  highlightSession,
  joinWindowOpen,
  openBookSession,
  openListenerSupport,
  openSessionDetails,
  quoteQuery,
}: {
  user: ApiUser | undefined;
  sessions: ApiCareSession[];
  listeners: ApiProvider[];
  listenersPreview: ApiProvider[];
  listenersQuery: any;
  highlightSession: ApiCareSession | null;
  joinWindowOpen: boolean;
  openBookSession: () => void;
  openListenerSupport: () => void;
  openSessionDetails: (s: ApiCareSession) => void;
  quoteQuery: any;
}) {
  const [mood, setMood] = useState(3);
  const [moodSubmitted, setMoodSubmitted] = useState(false);

  const upcomingCount = sessions.filter((s) => s.status === "UPCOMING").length;
  const streak = user?.profileSessionStats?.streakDays ?? 7;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section
        className="rounded-xl border border-[#2f745f]/15 bg-gradient-to-br from-[#f2f7f5] to-[#e4eedc] p-6 shadow-sm md:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2f745f]">
              Personal Wellness Companion
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1c2826] md:text-4xl">
              Hello, {user?.name?.split(" ")[0] ?? "Friend"} ☀️
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#5c6865]">
              Welcome back to your safe space. Take a slow breath, record your mood, and pursue your self-care goals today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openListenerSupport}
              className="rounded-lg bg-[#2f745f] hover:bg-[#204e40] text-white text-xs font-bold px-5 py-3 transition shadow-2xs"
            >
              Talk to a Listener
            </button>
            <Link
              href="/therapists"
              className="rounded-lg bg-[#e7dacd] hover:bg-[#ded3c4] text-[#3e4a48] text-xs font-bold px-5 py-3 transition shadow-2xs"
            >
              Find a Therapist
            </Link>
          </div>
        </div>

        {/* Daily Actions List */}
        <div className="mt-8 border-t border-[#2f745f]/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2f745f]">
            Daily Actions Checklist
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/dashboard/journal/write"
              className="flex items-center gap-2 rounded-lg bg-white/70 border border-[#2f745f]/10 px-4 py-2.5 text-xs font-semibold text-[#1c2826] hover:bg-white transition"
            >
              <span>✍️</span>
              <span>Write a Journal</span>
            </Link>
            <button
              onClick={() => openListenerSupport()}
              className="flex items-center gap-2 rounded-lg bg-white/70 border border-[#2f745f]/10 px-4 py-2.5 text-xs font-semibold text-[#1c2826] hover:bg-white transition"
            >
              <span>💬</span>
              <span>Join a Safe Circle</span>
            </button>
            <button
              onClick={() => setMoodSubmitted(true)}
              className="flex items-center gap-2 rounded-lg bg-white/70 border border-[#2f745f]/10 px-4 py-2.5 text-xs font-semibold text-[#1c2826] hover:bg-white transition"
            >
              <span>📊</span>
              <span>Complete Mood Check-in</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Upcoming Sessions
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1c2826]">{upcomingCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Scheduled consultations</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Wellness Streak
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2f745f]">{streak} Days 🔥</p>
          <p className="mt-1 text-xs text-neutral-500">Consecutive days active</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Wallet Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1c2826]">
            {formatCurrency(user?.wallet?.availableBalance)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Available for bookings</p>
        </div>
      </div>

      {/* Primary Work Area */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          {/* Highlight Session Card */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-2xs">
            <h3 className="font-display text-lg font-semibold text-[#1c2826] mb-4">
              Next Care Appointment
            </h3>
            {highlightSession ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-[#1c2826]">
                    Session with {sessionCounterpartyLabel(highlightSession, user?.id)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {toSentenceCase(highlightSession.sessionMode)} • {highlightSession.duration} mins
                  </p>
                  <p className="text-xs font-semibold text-[#2f745f] pt-1">
                    {formatDateTime(highlightSession.startTime)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {joinWindowOpen && highlightSession.meetingLink && (
                    <a
                      href={highlightSession.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#2f745f] hover:bg-[#204e40] text-white text-xs font-bold px-4 py-2.5 transition"
                    >
                      Join Meeting
                    </a>
                  )}
                  <button
                    onClick={() => openSessionDetails(highlightSession)}
                    className="rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-4 py-2.5 transition"
                  >
                    See Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-neutral-500">You haven&apos;t booked any sessions yet.</p>
                <button
                  onClick={openBookSession}
                  className="rounded-lg bg-[#2f745f] hover:bg-[#204e40] text-white text-xs font-bold px-4 py-2 transition"
                >
                  Book Your First Session
                </button>
              </div>
            )}
          </section>

          {/* Interactive Live Listeners Matching */}
          <section className="rounded-xl border border-neutral-200 bg-[#fbfdfc] p-6 text-left shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#1c2826]">
                  Active Community Support
                </h3>
                <p className="text-xs text-neutral-500">
                  Connect anonymously with peer supporters online now.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2f745f]">
                <span className="h-2 w-2 rounded-full bg-[#22c997] animate-ping" />
                <span>{listeners.length} online</span>
              </div>
            </div>

            {listenersQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ProviderRowSkeleton />
                <ProviderRowSkeleton />
              </div>
            ) : listenersPreview.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {listenersPreview.map((listener) => (
                  <button
                    key={listener.id}
                    onClick={openListenerSupport}
                    className="flex items-center gap-3 rounded-lg border border-neutral-150 bg-white p-3 text-left hover:border-[#2f745f]/20 transition"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f4ee] text-xs font-semibold text-[#2f745f]">
                      {listener.image ? (
                        <img src={listener.image} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        getInitials(listener.name)
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-neutral-800">{listener.name}</p>
                      <p className="truncate text-[9px] uppercase tracking-wider text-neutral-400">
                        {listener.languages[0] ?? "Peer support"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No listener matches available at this hour.</p>
            )}
          </section>
        </div>

        {/* Insights & Secondary Column */}
        <div className="space-y-6">
          {/* Mood Check-In Slider */}
          <section className="rounded-xl border border-[#bcead8]/30 bg-[#f4faf7] p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2f745f]">
              Mood Check-in
            </h3>
            <p className="text-xs text-neutral-500 mt-1">How are you feeling in this moment?</p>
            {moodSubmitted ? (
              <div className="mt-4 bg-white/80 p-3 rounded-lg text-center">
                <p className="text-xs font-bold text-[#2f745f]">Mood logged successfully! 💚</p>
                <button
                  onClick={() => setMoodSubmitted(false)}
                  className="mt-2 text-[10px] text-[#2f745f] underline"
                >
                  Log again
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between text-2xl px-1">
                  <span>😢</span>
                  <span>😕</span>
                  <span>😐</span>
                  <span>🙂</span>
                  <span>😊</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-1 bg-[#bcead8] rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={() => setMoodSubmitted(true)}
                  className="w-full rounded-lg bg-[#2f745f] hover:bg-[#204e40] py-2 text-xs font-bold text-white transition"
                >
                  Log Mood
                </button>
              </div>
            )}
          </section>

          {/* Today's Reflection */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Today&apos;s Reflection
            </h3>
            {quoteQuery.isLoading ? (
              <QuoteBlockSkeleton />
            ) : quoteQuery.data ? (
              <blockquote className="mt-3 relative pl-4 border-l-2 border-[#2f745f]/30">
                <p className="text-xs italic text-neutral-700 leading-relaxed">
                  &ldquo;{quoteQuery.data.text}&rdquo;
                </p>
                {quoteQuery.data.author && (
                  <cite className="mt-1 block text-[10px] font-bold text-[#2f745f] not-italic">
                    — {quoteQuery.data.author}
                  </cite>
                )}
              </blockquote>
            ) : (
              <p className="text-xs text-neutral-500 mt-2">Check back later for reflection insights.</p>
            )}
          </section>

          {/* Suggested Activity card */}
          <div className="rounded-xl bg-neutral-900 p-6 text-left text-white shadow-sm space-y-3">
            <span className="inline-block rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              RECOMMENDED READ
            </span>
            <h4 className="text-sm font-bold leading-snug">
              Developing Resiliency and Self-Compassion in Times of Change
            </h4>
            <Link
              href="/dashboard/library"
              className="inline-block text-xs font-semibold text-[#bcead8] hover:underline"
            >
              Explore Library →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   2. THERAPIST DASHBOARD (Practice Workspace)
   ========================================== */
function TherapistDashboardHome({
  user,
  sessions,
  highlightSession,
  joinWindowOpen,
  openSessionDetails,
  quoteQuery,
}: {
  user: ApiUser | undefined;
  sessions: ApiCareSession[];
  highlightSession: ApiCareSession | null;
  joinWindowOpen: boolean;
  openSessionDetails: (s: ApiCareSession) => void;
  quoteQuery: any;
}) {
  const [isOnline, setIsOnline] = useState(true);

  const todaySessions = useMemo(() => {
    return sessions.filter((s) => {
      const todayStr = new Date().toDateString();
      return new Date(s.startTime).toDateString() === todayStr;
    });
  }, [sessions]);

  const pendingRequests = useMemo(() => {
    return sessions.filter((s) => s.status === "UPCOMING").slice(0, 3);
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section
        className="rounded-xl border border-[#7c4df1]/15 bg-gradient-to-br from-[#f8f5fd] to-[#f0eafb] p-6 shadow-sm md:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c4df1]">
              Practice Management Workspace
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1c2826] md:text-4xl">
              Welcome, Dr. {user?.name?.split(" ")[0] ?? "Healer"} 👩‍⚕️
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
              Manage your consults, review appointment lists, and configure your clinic schedule from this panel.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-[#7c4df1]/10 self-start md:self-auto">
            <span className="text-xs font-bold text-neutral-700">Availability status:</span>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                isOnline ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {isOnline ? "Online & Booking" : "Offline"}
            </button>
          </div>
        </div>

        {/* Appointment Countdown */}
        <div className="mt-8 border-t border-[#7c4df1]/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c4df1]">
            Next Scheduled Consultation
          </h3>
          {highlightSession ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white/70 p-4 border border-[#7c4df1]/5 text-left">
              <div>
                <p className="text-sm font-bold text-neutral-800">
                  Client: {sessionCounterpartyLabel(highlightSession, user?.id)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatDateTime(highlightSession.startTime)} ({highlightSession.duration} mins)
                </p>
              </div>
              <div className="flex gap-2">
                {joinWindowOpen && (
                  <a
                    href={highlightSession.meetingLink ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-[#7c4df1] hover:bg-[#683cd7] text-white text-[10px] font-bold uppercase px-3 py-2 transition"
                  >
                    Join Room
                  </a>
                )}
                <button
                  onClick={() => openSessionDetails(highlightSession)}
                  className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase px-3 py-2 transition"
                >
                  View Notes
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 mt-2">No consults booked for the immediate slot.</p>
          )}
        </div>
      </motion.section>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Today&apos;s Earnings
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1c2826]">
            {formatCurrency(todaySessions.length * 1500)}
          </p>
          <p className="mt-1 text-xs text-green-600">Calculated from completed sessions</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Active Patients
          </p>
          <p className="mt-2 text-3xl font-bold text-[#7c4df1]">14 Clients</p>
          <p className="mt-1 text-xs text-neutral-500">In therapeutic caseload</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Pending Booking Requests
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{pendingRequests.length}</p>
          <p className="mt-1 text-xs text-neutral-500">Awaiting confirmation details</p>
        </div>
      </div>

      {/* Primary Work Area */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          {/* Today's Appointments Timeline */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-[#1c2826]">
                Today&apos;s Appointments
              </h3>
              <Link href="/dashboard/consultations" className="text-xs font-bold text-[#7c4df1] hover:underline">
                View Calendar →
              </Link>
            </div>
            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => openSessionDetails(session)}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-150 bg-[#fafafa] hover:bg-neutral-50 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-neutral-800">
                        {sessionCounterpartyLabel(session, user?.id)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {toSentenceCase(session.sessionMode)} • {session.duration} mins
                      </p>
                    </div>
                    <span className="rounded-full bg-[#7c4df1]/10 px-3 py-1 text-[10px] font-bold text-[#7c4df1]">
                      {formatDateTime(session.startTime).split(" at ")[1]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-6 text-center">No patients assigned yet.</p>
            )}
          </section>

          {/* Workload Indicator */}
          <section className="rounded-xl border border-neutral-200 bg-[#fbfdfb] p-6 text-left shadow-2xs">
            <h3 className="font-display text-lg font-semibold text-[#1c2826] mb-3">
              Practice workload distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1">
                  <span>Weekly capacity</span>
                  <span>70% full</span>
                </div>
                <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#7c4df1] h-full rounded-full" style={{ width: "70%" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-600">
                <div className="bg-white p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400">Completion rate</span>
                  <span className="block text-lg font-bold text-neutral-800 mt-1">98.4%</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400">Total sessions</span>
                  <span className="block text-lg font-bold text-neutral-800 mt-1">112 completed</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Reviews and Analytics Preview */}
        <div className="space-y-6">
          {/* Practice Rating Summary */}
          <section className="rounded-xl border border-[#ddcbfa]/40 bg-[#faf8fe] p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c4df1]">
              Average rating
            </h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-[#1c2826]">4.9</span>
              <span className="text-xs text-neutral-500">/ 5.0 rating</span>
            </div>
            <div className="flex text-[#ffca28] text-lg mt-1">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
          </section>

          {/* Testimonials Preview */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Patient reviews preview
              </h3>
              <Link href="/dashboard/analytics" className="text-[10px] font-bold text-[#7c4df1] hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-neutral-100">
              <div className="pt-2 text-xs">
                <p className="font-semibold text-neutral-800">★ 5.0</p>
                <p className="italic text-neutral-600 mt-0.5">
                  &ldquo;A wonderful experience. Felt completely heard.&rdquo;
                </p>
              </div>
              <div className="pt-3 text-xs">
                <p className="font-semibold text-neutral-800">★ 4.9</p>
                <p className="italic text-neutral-600 mt-0.5">
                  &ldquo;The sessions are extremely structured and supportive.&rdquo;
                </p>
              </div>
            </div>
          </section>

          {/* Today's Reflection */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Today&apos;s Quote
            </h3>
            {quoteQuery.isLoading ? (
              <QuoteBlockSkeleton />
            ) : quoteQuery.data ? (
              <blockquote className="mt-3 relative pl-4 border-l-2 border-[#7c4df1]/30">
                <p className="text-xs italic text-neutral-700 leading-relaxed">
                  &ldquo;{quoteQuery.data.text}&rdquo;
                </p>
              </blockquote>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   3. LISTENER DASHBOARD (Volunteer Support)
   ========================================== */
function ListenerDashboardHome({
  user,
  sessions,
  highlightSession,
  joinWindowOpen,
  openSessionDetails,
  quoteQuery,
}: {
  user: ApiUser | undefined;
  sessions: ApiCareSession[];
  highlightSession: ApiCareSession | null;
  joinWindowOpen: boolean;
  openSessionDetails: (s: ApiCareSession) => void;
  quoteQuery: any;
}) {
  const [isListenerOnline, setIsListenerOnline] = useState(true);

  // Retrieve incoming requests waiting matching (using simulated mock requests)
  const incomingRequests = useMemo(() => {
    return [
      { id: "req-1", concern: "Exam Anxiety", requestedTime: "5m ago" },
      { id: "req-2", concern: "Relationship breakdown", requestedTime: "12m ago" },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section
        className="rounded-xl border border-[#2b624c]/15 bg-gradient-to-br from-[#f4faf6] to-[#dce9dd] p-6 shadow-sm md:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2b624c]">
              Volunteer Service & Community Sanctuary
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1c2826] md:text-4xl">
              Welcome, Listener {user?.name?.split(" ")[0] ?? "volunteer"} 🌟
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#2f5248]">
              Your service provides a warm, confidential sanctuary for peers who need to be heard. 
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-[#2b624c]/10 self-start md:self-auto">
            <span className="text-xs font-bold text-neutral-700">Taking requests:</span>
            <button
              onClick={() => setIsListenerOnline(!isListenerOnline)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                isListenerOnline ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {isListenerOnline ? "Active" : "Offline"}
            </button>
          </div>
        </div>

        {/* Operational Priority stats */}
        <div className="mt-8 border-t border-[#2b624c]/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2b624c]">
            Sanctuary Status
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white/70 p-4 border border-[#2b624c]/5 text-left">
              <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Waiting Requests</span>
              <p className="text-lg font-bold text-neutral-800 mt-1">{incomingRequests.length} people queueing</p>
            </div>
            <div className="rounded-lg bg-white/70 p-4 border border-[#2b624c]/5 text-left">
              <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Next Scheduled Shift Slot</span>
              <p className="text-lg font-bold text-neutral-800 mt-1">7:00 PM tonight</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Waiting Requests
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1c2826]">{incomingRequests.length}</p>
          <p className="mt-1 text-xs text-neutral-500">Need support now</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Hours Volunteered
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2b624c]">42 Hours</p>
          <p className="mt-1 text-xs text-neutral-500">Total duration contributed</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Appreciation Score
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2b624c]">98%</p>
          <p className="mt-1 text-xs text-neutral-500">Client satisfaction metric</p>
        </div>
      </div>

      {/* Primary Work Area */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          {/* Pending Support Requests (Actionable Queue) */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-[#1c2826]">
                Incoming Support Requests
              </h3>
              <Link href="/dashboard/support-requests" className="text-xs font-bold text-[#2b624c] hover:underline">
                View Queue →
              </Link>
            </div>

            {incomingRequests.length > 0 ? (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-neutral-150 bg-[#fafafa]"
                  >
                    <div>
                      <p className="text-sm font-bold text-neutral-800">
                        Topic: {req.concern}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">Requested {req.requestedTime}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert("Request accepted! Starting peer connection...")}
                        className="rounded bg-[#2b624c] hover:bg-[#1b4132] text-white text-[10px] font-bold uppercase px-3 py-2 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => alert("Declined request.")}
                        className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase px-3 py-2 transition"
                      >
                        Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-6 text-center">No support requests at the moment.</p>
            )}
          </section>

          {/* Volunteer Milestone Tracking */}
          <section className="rounded-xl border border-neutral-200 bg-[#fbfdfb] p-6 text-left shadow-2xs">
            <h3 className="font-display text-lg font-semibold text-[#1c2826] mb-3">
              Volunteer progress milestones
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-neutral-600 mb-1">
                  <span>Listener certification level 2</span>
                  <span>12 / 15 lives supported</span>
                </div>
                <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2b624c] h-full rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-600">
                <div className="bg-white p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400">Response efficiency</span>
                  <span className="block text-lg font-bold text-neutral-800 mt-1">2.4 min avg</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400">Volunteer Streak</span>
                  <span className="block text-lg font-bold text-neutral-800 mt-1">5 days active</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Training and Community appreciation */}
        <div className="space-y-6">
          {/* Training Checklist */}
          <section className="rounded-xl border border-[#bcead8]/45 bg-[#f4faf7] p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2b624c]">
              Training Center progress
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-neutral-700">
                <span className="text-green-600 font-bold">✓</span>
                <span>Active Listening 101 (Completed)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-700">
                <span className="text-neutral-300 font-bold">○</span>
                <span>Crisis Navigation (In Progress)</span>
              </div>
            </div>
            <Link href="/dashboard/training-center" className="mt-4 block text-[10px] font-bold text-[#2b624c] hover:underline">
              Continue training →
            </Link>
          </section>

          {/* Appreciation block */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Community Appreciation
            </h3>
            <div className="mt-3 bg-neutral-50 p-4 rounded-lg text-xs italic text-neutral-600 border border-neutral-100">
              &ldquo;Thank you for listening when I had no one else to talk to. Your kindness helped me through a tough night.&rdquo;
            </div>
          </section>

          {/* Today's Reflection */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Today&apos;s Quote
            </h3>
            {quoteQuery.isLoading ? (
              <QuoteBlockSkeleton />
            ) : quoteQuery.data ? (
              <blockquote className="mt-3 relative pl-4 border-l-2 border-[#2b624c]/30">
                <p className="text-xs italic text-neutral-700 leading-relaxed">
                  &ldquo;{quoteQuery.data.text}&rdquo;
                </p>
              </blockquote>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
