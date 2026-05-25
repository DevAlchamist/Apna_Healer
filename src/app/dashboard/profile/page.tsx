"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ProfilePageSkeleton, SessionRowSkeleton } from "@/components/skeletons";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import {
  applicationDataPrimaryLine,
  displayAccountLabel,
  formatCurrency,
  formatShortDate,
  getInitials,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiApplication, ApiCareSession, ApiUser } from "@/types/api";
import { ProfileProfessionalCta } from "@/components/dashboard/professional-apply/profile-professional-cta";
import { ProfileEditModal } from "@/components/dashboard/profile-edit-modal";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";

const FOREST = "#2D5A4C";
const PAGE_TINT = "#fdfbf7";
const BEIGE = "#ebe4d8";
const RING_CIRCUMFERENCE = 2 * Math.PI * 42;

function sectionMotion(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { ...morphTransition, delay },
  };
}

function ApplicationIcon({ status }: { status: ApiApplication["status"] }) {
  if (status === "APPROVED") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z" />
        <path d="m9.2 12.8 1.9 1.9 3.8-4.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h4" strokeLinecap="round" />
    </svg>
  );
}

function journeyLevel(completed: number) {
  return Math.min(12, 1 + Math.floor(completed / 6));
}

function formatZenTime(totalMinutes: number): string {
  if (totalMinutes >= 120) return `${(totalMinutes / 60).toFixed(1)} h`;
  if (totalMinutes >= 60) return `${Math.round(totalMinutes / 60)} h`;
  return `${Math.max(0, Math.round(totalMinutes))}m`;
}

function focusScoreLabel(avg: number | null | undefined): string {
  if (avg == null || Number.isNaN(avg)) return "—";
  return `${Math.min(100, Math.round(avg * 20))}%`;
}

function membershipLabel(user: ApiUser): string {
  switch (user.role) {
    case "ADMIN":
      return "Administrator";
    case "THERAPIST":
      return "Professional Therapist";
    case "LISTENER":
      return "Sanctuary Listener";
    default:
      return "Community Member";
  }
}

function applicationStatusBadge(status: ApiApplication["status"]) {
  switch (status) {
    case "PENDING":
      return { label: "Under review", className: "bg-[#e8e4dc] text-[#4a4a4a]" };
    case "APPROVED":
      return { label: "Approved", className: "bg-[#eef2ef] text-[#7a8a82]" };
    case "REJECTED":
      return { label: "Rejected", className: "bg-[#f5ebe8] text-[#9a6b63]" };
    default:
      return { label: toSentenceCase(status), className: "bg-[#e8e4dc] text-[#4a4a4a]" };
  }
}

export default function ProfilePage() {
  const { open: openSessionDetails } = useSessionDetailsModal();
  const [editOpen, setEditOpen] = useState(false);
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const sessionsQuery = useQuery({
    queryKey: ["profile-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?take=40"),
    enabled: !!userQuery.data,
  });

  const user = userQuery.data;
  const applications = user?.applications ?? [];
  const stats = user?.profileSessionStats;

  const profileSessions = useMemo(() => {
    const list = sessionsQuery.data ?? [];
    return [...list].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [sessionsQuery.data]);

  const completedPractices = useMemo(
    () => profileSessions.filter((s) => s.status === "COMPLETED").slice(0, 4),
    [profileSessions],
  );

  const displayBio = useMemo(() => {
    if (!user) return "";
    if (user.bio?.trim()) return user.bio.trim();
    return (
      user.therapistProfile?.bio ||
      user.listenerProfile?.bio ||
      (applications[0] ? applicationDataPrimaryLine(applications[0].applicationData) : null) ||
      "Your profile is ready. Add a short bio so healers know what matters to you."
    );
  }, [user, applications]);

  const primaryFocusDisplay = useMemo(() => {
    if (!user) return "—";
    if (user.primaryFocus?.trim()) return user.primaryFocus.trim();
    const spec = user.therapistProfile?.specializations?.[0];
    if (spec) return spec;
    const lang = user.listenerProfile?.languages?.[0];
    if (lang) return `${lang} listening`;
    return "Mindfulness · Healing journey";
  }, [user]);

  const interestChips = useMemo(() => {
    const tags = user?.interestTags?.filter(Boolean) ?? [];
    if (tags.length) return tags;
    if (!user) return [];
    const fallback =
      user.therapistProfile?.specializations?.slice(0, 3) ??
      user.listenerProfile?.languages?.slice(0, 3) ??
      [];
    if (fallback.length) return fallback;
    return [toSentenceCase(user.role), user.isVerified ? "Verified" : "Pending review"];
  }, [user]);

  const activeApplications = applications.filter((a) => a.status === "PENDING").length;

  const completedCount = stats?.completedCount ?? 0;
  const level = journeyLevel(completedCount);
  const streak = stats?.streakDays ?? 0;
  const zen = formatZenTime(stats?.totalMinutesCompleted ?? 0);
  const focus = focusScoreLabel(stats?.avgRatingGiven ?? null);

  const sessionsPerLevel = 5;
  const mod = completedCount % sessionsPerLevel;
  const progressPct = mod === 0 && completedCount > 0 ? 100 : Math.round((mod / sessionsPerLevel) * 100);
  const sessionsToNext = mod === 0 ? sessionsPerLevel : sessionsPerLevel - mod;

  const memberYear = user ? new Date(user.createdAt).getFullYear() : "—";
  const timezoneCity =
    [user?.timezone?.replace(/_/g, " "), user?.city?.trim()].filter(Boolean).join(" / ") || "—";

  if (userQuery.isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <FadeIn className="space-y-6 pb-10 md:space-y-8 md:pb-12">
      <ProfileEditModal open={editOpen} onClose={() => setEditOpen(false)} user={user ?? null} />

      {userQuery.error ? (
        <div className="rounded-calm bg-white px-6 py-5 text-sm font-medium text-[#cf4f45] shadow-soft">
          {userQuery.error.message}
        </div>
      ) : null}

      {/* Hero */}
      <motion.section
        className="overflow-hidden rounded-[1.75rem] border border-[#2D5A4C]/10 shadow-[0_20px_50px_-28px_rgba(45,90,76,0.35)]"
        style={{ backgroundColor: PAGE_TINT }}
        {...sectionMotion(0)}
      >
        <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,200px)_1fr] md:p-10">
          <div className="relative mx-auto w-44 shrink-0 md:mx-0">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "Profile"}
                className="aspect-square w-full rounded-full border-[5px] border-white object-cover shadow-lg"
              />
            ) : (
              <div
                className="flex aspect-square w-full items-center justify-center rounded-full border-[5px] border-white text-4xl font-semibold text-white shadow-lg"
                style={{ background: `linear-gradient(145deg, ${FOREST}, #5a9d82)` }}
              >
                {getInitials(user?.name, user?.email)}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
              style={{ backgroundColor: FOREST }}
            >
              LVL {level}
            </span>
          </div>

          <div className="min-w-0 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary/45">
              Member since {memberYear}
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1a1a1a] md:text-[2.75rem]">
              {displayAccountLabel(user?.name, user?.email)}
            </h1>

            <p className="max-w-2xl text-base italic leading-relaxed text-text-primary/70 md:text-lg">
              &ldquo;{displayBio}&rdquo;
            </p>

            <div className="flex flex-wrap gap-2">
              {interestChips.map((tag, i) => (
                <motion.span
                  key={tag}
                  className="rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-medium text-[#4a4a4a] shadow-sm ring-1 ring-black/[0.06]"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...morphTransition, delay: 0.12 + i * 0.04 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>

            <motion.div className="flex flex-wrap gap-3 pt-1" {...sectionMotion(0.08)}>
              <motion.button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                style={{ backgroundColor: FOREST }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={hoverLiftTransition}
              >
                Edit profile
              </motion.button>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-[#2D5A4C]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#3d3d3d] shadow-sm transition hover:bg-white/90"
              >
                Book a session
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#2D5A4C]/10 bg-white/55 px-6 py-4 text-sm sm:grid-cols-3 md:px-10">
          <p className="flex items-center gap-2 font-medium text-[#3d3d3d]">
            <WalletIcon />
            <span>
              Wallet: <span className="font-semibold">{formatCurrency(user?.wallet?.availableBalance)}</span>
            </span>
          </p>
          <p className="flex items-center gap-2 font-medium text-[#3d3d3d]">
            <ClipboardIcon />
            <span>
              Applications:{" "}
              <span className="font-semibold">
                {activeApplications} active
              </span>
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-2 font-medium text-[#3d3d3d] sm:justify-end">
            <span>
              Current role: <span className="font-semibold">{toSentenceCase(user?.role ?? "USER")}</span>
            </span>
            {user?.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f0ea] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2D5A4C]">
                <CheckTiny />
                Verified
              </span>
            ) : null}
          </p>
        </div>
      </motion.section>

      {/* Metrics + growth */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.1 }}
      >
        <MetricCard label="Sessions completed" value={String(completedCount)} delay={0.12} />
        <MetricCard
          label="Current streak"
          value={streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "0"}
          delay={0.14}
        />
        <MetricCard label="Zen time" value={zen} delay={0.16} />
        <MetricCard label="Focus score" value={focus} delay={0.18} />
        <GrowthPathCard
          progressPct={progressPct}
          sessionsToNext={sessionsToNext}
          level={level}
          delay={0.2}
        />
      </motion.div>

      {/* Identity + practice */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.article
          className="rounded-[1.35rem] p-6 md:p-8"
          style={{ backgroundColor: `${BEIGE}cc` }}
          {...sectionMotion(0.14)}
        >
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[#3d2f24] md:text-2xl">
            <UserTinyIcon />
            Identity details
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <IdentityField label="Email address" value={user?.email ?? "—"} />
            <IdentityField label="Primary focus" value={primaryFocusDisplay} />
            <IdentityField label="Timezone / city" value={timezoneCity} />
            <IdentityField
              label="Membership type"
              value={user ? membershipLabel(user) : "—"}
              italic
            />
            <IdentityField label="Phone" value={user?.phone?.trim() || "—"} />
            <IdentityField label="Account" value={user?.isVerified ? "Verified member" : "Pending verification"} />
          </div>
        </motion.article>

        <PracticeDetailsCard user={user} interestChips={interestChips} delay={0.18} />
      </div>

      {/* Recent practices + applications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] md:p-8"
          {...sectionMotion(0.2)}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#1a1a1a] md:text-2xl">Recent practices</h2>
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-wide text-[#2D5A4C] transition hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {sessionsQuery.isLoading ? (
              <>
                {Array.from({ length: 2 }).map((_, i) => (
                  <SessionRowSkeleton key={i} className="rounded-xl bg-[#f7faf8]" />
                ))}
              </>
            ) : completedPractices.length === 0 ? (
              <p className="rounded-xl bg-[#f7faf8] px-4 py-4 text-sm text-text-primary/60">
                Completed sessions will appear here once you finish a practice.
              </p>
            ) : (
              completedPractices.slice(0, 2).map((session, index) => (
                <motion.button
                  key={session.id}
                  type="button"
                  onClick={() => openSessionDetails(session)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...morphTransition, delay: 0.22 + index * 0.05 }}
                  className="flex w-full items-center gap-4 rounded-xl bg-[#f7faf8] px-4 py-3.5 text-left transition hover:bg-white hover:shadow-sm"
                  whileHover={{ y: -1 }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e3f0ea] text-[#2D5A4C]">
                    {index % 2 === 0 ? <LeafIcon /> : <PlantIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">
                      {session.sessionMode === "LISTENER" ? "Listening session" : "Therapy session"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-primary/55">
                      {formatShortDate(session.startTime)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-semibold text-[#1a1a1a]">{session.duration}m</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-text-primary/40">Duration</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] md:p-8"
          {...sectionMotion(0.24)}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#1a1a1a] md:text-2xl">Application history</h2>
            <Link
              href="/dashboard/profile#applications"
              className="text-xs font-semibold uppercase tracking-wide text-[#2D5A4C] transition hover:underline"
            >
              Track progress
            </Link>
          </div>
          <div id="applications" className="mt-6 space-y-3 scroll-mt-24">
            {applications.length === 0 ? (
              <p className="rounded-xl bg-[#f7faf8] px-4 py-4 text-sm text-text-primary/60">
                You have not submitted any provider applications yet.
              </p>
            ) : (
              applications.slice(0, 4).map((application, index) => {
                const badge = applicationStatusBadge(application.status);
                return (
                  <motion.article
                    key={application.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...morphTransition, delay: 0.26 + index * 0.05 }}
                    className="flex items-center gap-4 rounded-xl bg-[#f7faf8] px-4 py-3.5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ebe4d8] text-[#5c5348]">
                      <ApplicationIcon status={application.status} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary">
                        {toSentenceCase(application.type)} application
                      </p>
                      <p className="mt-0.5 text-xs text-text-primary/55">
                        Applied {formatShortDate(application.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </motion.article>
                );
              })
            )}
          </div>
        </motion.section>
      </div>

      {user ? <ProfileProfessionalCta user={user} /> : null}
    </FadeIn>
  );
}

function IdentityField({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary/40">{label}</p>
      <p className={`mt-1.5 text-base font-medium text-[#2a2a2a] md:text-lg ${italic ? "italic" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function MetricCard({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.article
      className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...morphTransition, delay }}
      whileHover={{ y: -2 }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-primary/45">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-[#1a1a1a]">{value}</p>
    </motion.article>
  );
}

function GrowthPathCard({
  progressPct,
  sessionsToNext,
  level,
  delay,
}: {
  progressPct: number;
  sessionsToNext: number;
  level: number;
  delay: number;
}) {
  const offset = RING_CIRCUMFERENCE - (progressPct / 100) * RING_CIRCUMFERENCE;

  return (
    <motion.article
      className="flex flex-col rounded-[1.25rem] p-5 sm:col-span-2 xl:col-span-1"
      style={{ backgroundColor: BEIGE }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...morphTransition, delay }}
    >
      <h3 className="font-display text-lg font-semibold text-[#3d2f24]">Growth path</h3>
      <div className="relative mx-auto mt-3 flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#d5cec4" strokeWidth="9" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={FOREST}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.15 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-xl font-semibold text-[#3d2f24]">{progressPct}%</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-text-primary/60">
        {sessionsToNext} more session{sessionsToNext === 1 ? "" : "s"} to level {Math.min(12, level + 1)}
      </p>
      <div className="mt-4 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          style={{ backgroundColor: "#4a3728" }}
        >
          Continue journey
        </Link>
      </div>
    </motion.article>
  );
}

function PracticeDetailsCard({
  user,
  interestChips,
  delay,
}: {
  user: ApiUser | undefined;
  interestChips: string[];
  delay: number;
}) {
  const tp = user?.therapistProfile;
  const lp = user?.listenerProfile;

  return (
    <motion.article
      className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] md:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...morphTransition, delay }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#3d2f24] md:text-2xl">Practice details</h2>
          <p className="mt-1 max-w-md text-sm text-text-primary/55">
            Comprehensive professional background and current clinical engagement metrics.
          </p>
        </div>
        {user?.role === "THERAPIST" && tp?.hourlyRate ? (
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wide text-text-primary/45">
              <BriefcaseTiny />
              Session fee
            </p>
            <p className="mt-0.5 font-display text-2xl font-semibold text-[#2D5A4C]">
              ₹{Math.round(Number(tp.hourlyRate))}{" "}
              <span className="text-base font-medium text-text-primary/50">/hr</span>
            </p>
          </div>
        ) : null}
      </div>

      <hr className="my-6 border-[#ebe4d8]" />

      {user?.role === "THERAPIST" && tp ? (
        <>
          <div className="grid gap-6 sm:grid-cols-3">
            <PracticeStat
              icon={<ClockPracticeIcon />}
              label="Clinical experience"
              value={
                tp.experienceYears != null ? `${tp.experienceYears} years` : "—"
              }
            />
            <PracticeStat
              icon={<BrainIcon />}
              label="Core specializations"
              value={tp.specializations?.slice(0, 2).join(" & ") || "—"}
            />
            <PracticeStat
              icon={<PinIcon />}
              label="Highest certification"
              value={tp.certifications?.[0] ?? "—"}
            />
          </div>
          {tp.specializations?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tp.specializations.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1 text-xs font-medium text-[#5c5348]"
                  style={{ backgroundColor: BEIGE }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : user?.role === "LISTENER" && lp ? (
        <div className="grid gap-6 sm:grid-cols-3">
          <PracticeStat
            icon={<BrainIcon />}
            label="Languages"
            value={lp.languages?.join(", ") || "—"}
          />
          <PracticeStat
            icon={<PinIcon />}
            label="Strengths"
            value={lp.emotionalStrengths?.slice(0, 2).join(" · ") || "—"}
          />
          <PracticeStat icon={<ClockPracticeIcon />} label="Role" value="Active listener" />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-primary/65">
            Apply to become a listener or therapist to unlock practice metrics, session fees, and professional tags on
            your profile.
          </p>
          <div className="flex flex-wrap gap-2">
            {interestChips.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs font-medium text-[#5c5348]"
                style={{ backgroundColor: BEIGE }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}

function PracticeStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="text-[#2D5A4C]/70">{icon}</span>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-text-primary/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#2a2a2a]">{value}</p>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#2D5A4C]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="16" height="11" rx="2" />
      <path d="M2 8h16M14 11h2" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#2D5A4C]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="3" width="12" height="14" rx="1.5" />
      <path d="M7 3.5V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M7 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckTiny() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserTinyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#5c5348]" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 22C12 22 4 16 4 10a8 8 0 0 1 16 0c0 6-8 12-8 12Z" />
      <path d="M12 22V10" strokeLinecap="round" />
    </svg>
  );
}

function PlantIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 22V12M12 12C12 8 8 4 4 4c0 4 4 8 8 8M12 12c0-4 4-8 8-8 0 4-4 8-8 8" strokeLinecap="round" />
    </svg>
  );
}

function BriefcaseTiny() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="12" height="8" rx="1" />
      <path d="M6 5V4a2 2 0 0 1 4 0v1" />
    </svg>
  );
}

function ClockPracticeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" strokeLinecap="round" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 3c-2 0-3.5 1.5-3.5 3.5 0 1 .5 1.8 1.2 2.3C6 10 5 11.5 5 13.5 5 16 7 18 10 18s5-2 5-4.5c0-2-1-3.5-2.7-4.7.7-.5 1.2-1.3 1.2-2.3C13.5 4.5 12 3 10 3Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2l-4 7h3v7h2v-7h3L10 2Z" strokeLinejoin="round" />
    </svg>
  );
}
