"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarPair } from "@/components/dashboard/user-avatar-circle";
import { StatCardsSkeleton, UserGridSkeleton } from "@/components/skeletons";
import { formatDateTime, formatShortDate, toSentenceCase } from "@/lib/display";
import type {
  ApiApplication,
  ApiBooking,
  ApiCareSession,
  ApiProvider,
  ApiUser,
} from "@/types/api";

const viewport = { once: true, amount: 0.2 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeBlock = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

function wasCreatedWithin(date: string, days: number) {
  const createdAt = new Date(date).getTime();
  const windowStart = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt >= windowStart;
}

export function AdminCommunitiesPage() {
  const usersQuery = useQuery({
    queryKey: ["admin-communities-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });
  const providersQuery = useQuery({
    queryKey: ["admin-communities-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=100"),
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-communities-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/applications?take=100"),
  });
  const bookingsQuery = useQuery({
    queryKey: ["admin-communities-bookings"],
    queryFn: () => apiFetch<ApiBooking[]>("/api/bookings?scope=all&take=100"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["admin-communities-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?scope=all&take=100"),
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const communityMembers = useMemo(
    () => users.filter((user) => user.role !== "ADMIN"),
    [users],
  );
  const memberAccounts = useMemo(
    () => communityMembers.filter((user) => user.role === "USER"),
    [communityMembers],
  );
  const engagedMemberCount = useMemo(() => {
    const engagedIds = new Set<string>();

    for (const booking of bookings) {
      engagedIds.add(booking.userId);
    }

    for (const session of sessions) {
      engagedIds.add(session.userId);
    }

    return engagedIds.size;
  }, [bookings, sessions]);
  const newMembers = useMemo(
    () => communityMembers.filter((user) => wasCreatedWithin(user.createdAt, 30)),
    [communityMembers],
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING"),
    [bookings],
  );
  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (session) => session.status === "UPCOMING" || session.status === "ONGOING",
      ),
    [sessions],
  );
  const openApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === "PENDING",
      ),
    [applications],
  );
  const providerCoverage = useMemo(
    () => providers.filter((provider) => provider.nextAvailabilityDate),
    [providers],
  );
  const membersAwaitingFirstSession = useMemo(() => {
    const sessionParticipants = new Set(sessions.map((session) => session.userId));
    const membersWithOpenRequest = new Set(
      bookings
        .filter((booking) => booking.status === "PENDING" || booking.status === "ACCEPTED")
        .map((booking) => booking.userId),
    );

    return memberAccounts.filter(
      (member) =>
        membersWithOpenRequest.has(member.id) && !sessionParticipants.has(member.id),
    ).length;
  }, [bookings, memberAccounts, sessions]);

  const stats = useMemo(
    () => [
      {
        label: "Community Members",
        value: String(communityMembers.length),
        meta: `${communityMembers.filter((user) => user.isVerified).length} verified identities`,
      },
      {
        label: "Engaged Members",
        value: String(engagedMemberCount),
        meta: `${newMembers.length} joined in the last 30 days`,
      },
      {
        label: "Support Queue",
        value: String(pendingBookings.length + activeSessions.length),
        meta: `${pendingBookings.length} pending bookings • ${activeSessions.length} live or upcoming sessions`,
      },
      {
        label: "Provider Coverage",
        value: String(providerCoverage.length),
        meta: `${openApplications.length} provider applications still open`,
      },
    ],
    [
      activeSessions.length,
      communityMembers,
      engagedMemberCount,
      newMembers.length,
      openApplications.length,
      pendingBookings.length,
      providerCoverage.length,
    ],
  );

  const recentMembers = useMemo(
    () =>
      [...communityMembers]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 6),
    [communityMembers],
  );
  const supportQueue = useMemo(
    () =>
      [...pendingBookings]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 6),
    [pendingBookings],
  );
  const careChampions = useMemo(
    () =>
      [...providers]
        .sort((left, right) => right.sessionCount - left.sessionCount)
        .slice(0, 5),
    [providers],
  );

  const queryError =
    usersQuery.error?.message ??
    providersQuery.error?.message ??
    applicationsQuery.error?.message ??
    bookingsQuery.error?.message ??
    sessionsQuery.error?.message;

  const isPageLoading =
    usersQuery.isLoading ||
    providersQuery.isLoading ||
    applicationsQuery.isLoading ||
    bookingsQuery.isLoading ||
    sessionsQuery.isLoading;

  if (isPageLoading) {
    return (
      <div className="space-y-9 pb-6">
        <StatCardsSkeleton count={4} />
        <UserGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-9 pb-6">
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
      >
        <motion.div variants={fadeBlock}>
          <h1 className="font-display text-[42px] font-semibold tracking-[-0.03em] text-[#243230] md:text-[52px]">
            Community Operations
          </h1>
          <p className="mt-2 max-w-[820px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live view of member growth, care engagement, support demand, and provider coverage
            across the platform. There is no separate communities backend yet, so this page tracks
            the health of the real community already formed by users, providers, and care activity.
          </p>
        </motion.div>

        {queryError ? (
          <div className="mt-6 rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-[#cf4f45] shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]">
            {queryError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <motion.article
              key={stat.label}
              variants={fadeBlock}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="rounded-[30px] border border-[#f0eeea] bg-white px-6 py-7 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b1a89d]">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-[#2f6f5b]">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <motion.h2
            variants={fadeBlock}
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
          >
            Cohort Health
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-[#f7f4ee] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3917d]">
                  Verified Access
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#243230]">
                  {communityMembers.filter((user) => user.isVerified).length}
                </p>
                <p className="mt-1 text-sm text-text-primary/55">
                  of {communityMembers.length} non-admin accounts
                </p>
              </div>
              <div className="rounded-[22px] bg-[#eef7f2] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b8f7f]">
                  Awaiting First Session
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#243230]">
                  {membersAwaitingFirstSession}
                </p>
                <p className="mt-1 text-sm text-text-primary/55">
                  members with an open request but no completed handoff yet
                </p>
              </div>
              <div className="rounded-[22px] bg-[#f4f2fb] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a80a4]">
                  New Members
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#243230]">{newMembers.length}</p>
                <p className="mt-1 text-sm text-text-primary/55">
                  joined during the last 30 days
                </p>
              </div>
              <div className="rounded-[22px] bg-[#fff3ee] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bb7e5c]">
                  Open Provider Intake
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#243230]">
                  {openApplications.length}
                </p>
                <p className="mt-1 text-sm text-text-primary/55">
                  applications can still become future community support capacity
                </p>
              </div>
            </div>
          </motion.article>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-[#243230]">
                  Recent Community Joins
                </h3>
                <p className="mt-1 text-sm text-text-primary/55">
                  Latest non-admin accounts entering the ecosystem.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[22px] border border-[#f1ede8] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-semibold text-[#243230]">
                        {member.name ?? member.email}
                      </p>
                      <p className="mt-1 text-sm text-text-primary/45">{member.email}</p>
                    </div>
                    <span className="rounded-full bg-[#f3efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d896f]">
                      {toSentenceCase(member.role)}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                    Joined {formatShortDate(member.createdAt)}
                  </p>
                </div>
              ))}

              {recentMembers.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[#ddd5cb] px-4 py-5 text-sm text-text-primary/55">
                  No member accounts are currently loaded.
                </div>
              ) : null}
            </div>
          </motion.article>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <motion.h2
            variants={fadeBlock}
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
          >
            Support Queue
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="space-y-4">
              {supportQueue.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[22px] border border-[#f1ede8] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <UserAvatarPair
                        participant={booking.user}
                        provider={booking.provider}
                        sizeClassName="h-10 w-10"
                      />
                      <div className="min-w-0">
                        <p className="text-[17px] font-semibold text-[#243230]">
                          {booking.user?.name ?? "Participant"} with{" "}
                          {booking.provider?.name ?? "Provider"}
                        </p>
                        <p className="mt-1 text-sm text-text-primary/45">
                          {toSentenceCase(booking.type)} request • {booking.duration} mins
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#fff4e7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ba7d43]">
                      {toSentenceCase(booking.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                    Requested {formatDateTime(booking.requestedDate)}
                  </p>
                </div>
              ))}

              {supportQueue.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[#ddd5cb] px-4 py-5 text-sm text-text-primary/55">
                  No pending care requests are currently waiting in the queue.
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-[22px] bg-[#f7f4ee] px-4 py-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-[#243230]">Upcoming or ongoing sessions:</span>{" "}
                {activeSessions.length}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-[#243230]">Completed sessions loaded:</span>{" "}
                {sessions.filter((session) => session.status === "COMPLETED").length}
              </p>
            </div>
          </motion.article>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <h3 className="font-display text-[30px] font-semibold tracking-[-0.03em] text-[#243230]">
              Member Spaces
            </h3>
            <p className="mt-1 text-sm text-text-primary/55">
              Current member-facing surfaces the community can already access.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { href: "/dashboard/community", label: "Community Hub" },
                { href: "/dashboard/safe-circle", label: "Safe Circle" },
                { href: "/dashboard/blog", label: "Blog" },
                { href: "/dashboard/events", label: "Events" },
                { href: "/dashboard/clubs", label: "Clubs" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-[#efe6d9] px-4 py-2 text-sm font-semibold text-[#5a4b3f] transition-colors duration-300 hover:bg-[#e6dbc9]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.article>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <motion.h2
            variants={fadeBlock}
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
          >
            Provider Coverage
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="rounded-[22px] bg-[#eef7f2] px-4 py-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-[#243230]">Available providers:</span>{" "}
                {providerCoverage.length} of {providers.length} currently publish availability.
              </p>
              <p className="mt-2">
                <span className="font-semibold text-[#243230]">Listener coverage:</span>{" "}
                {providerCoverage.filter((provider) => provider.role === "LISTENER").length} open
                listener profiles.
              </p>
              <p className="mt-2">
                <span className="font-semibold text-[#243230]">Therapist coverage:</span>{" "}
                {providerCoverage.filter((provider) => provider.role === "THERAPIST").length} open
                therapist profiles.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {careChampions.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-[22px] border border-[#f1ede8] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-semibold text-[#243230]">
                        {provider.name ?? "Verified provider"}
                      </p>
                      <p className="mt-1 text-sm text-text-primary/45">
                        {toSentenceCase(provider.role)}
                        {provider.specializations[0]
                          ? ` • ${provider.specializations[0]}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6481a2]">
                      {provider.sessionCount} sessions
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                    Next availability {formatShortDate(provider.nextAvailabilityDate)}
                  </p>
                </div>
              ))}

              {careChampions.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[#ddd5cb] px-4 py-5 text-sm text-text-primary/55">
                  No provider records are currently available for community coverage review.
                </div>
              ) : null}
            </div>
          </motion.article>
        </motion.section>
      </div>
    </div>
  );
}
