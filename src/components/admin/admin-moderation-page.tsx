"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarCircle, UserAvatarPair } from "@/components/dashboard/user-avatar-circle";
import { formatDateTime, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiApplication, ApiBooking, ApiCareSession, ApiUser } from "@/types/api";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";

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

export function AdminModerationPage() {
  const usersQuery = useQuery({
    queryKey: ["admin-moderation-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-moderation-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/applications?take=100"),
  });
  const bookingsQuery = useQuery({
    queryKey: ["admin-moderation-bookings"],
    queryFn: () => apiFetch<ApiBooking[]>("/api/bookings?scope=all&take=100"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["admin-moderation-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?scope=all&take=100"),
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const applicationQueue = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === "PENDING",
      ),
    [applications],
  );

  const identityWatch = useMemo(
    () =>
      users
        .filter((user) => !user.isVerified)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 8),
    [users],
  );

  const disruptedSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.status === "MISSED" || session.status === "CANCELLED")
        .sort(
          (left, right) =>
            new Date(right.startTime).getTime() - new Date(left.startTime).getTime(),
        )
        .slice(0, 8),
    [sessions],
  );

  const disruptedBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "REJECTED" || booking.status === "CANCELLED")
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
        .slice(0, 8),
    [bookings],
  );

  const stats = useMemo(
    () => [
      {
        label: "Open Reviews",
        value: String(applicationQueue.length),
        meta: `${applications.filter((application) => application.status === "APPROVED").length} approved applications`,
      },
      {
        label: "Identity Watch",
        value: String(identityWatch.length),
        meta: `${users.filter((user) => !user.isVerified && user.role !== "USER").length} provider accounts pending trust signals`,
      },
      {
        label: "Disrupted Sessions",
        value: String(disruptedSessions.length),
        meta: `${sessions.filter((session) => session.status === "UPCOMING").length} upcoming sessions still healthy`,
      },
      {
        label: "Rejected / Cancelled Bookings",
        value: String(disruptedBookings.length),
        meta: `${bookings.filter((booking) => booking.status === "PENDING").length} pending requests remain open`,
      },
    ],
    [applicationQueue.length, applications, bookings, disruptedBookings.length, disruptedSessions.length, identityWatch.length, sessions, users],
  );

  const queryError =
    usersQuery.error?.message ??
    applicationsQuery.error?.message ??
    bookingsQuery.error?.message ??
    sessionsQuery.error?.message;

  const isPageLoading =
    usersQuery.isLoading ||
    applicationsQuery.isLoading ||
    bookingsQuery.isLoading ||
    sessionsQuery.isLoading;

  if (isPageLoading) {
    return (
      <div className="space-y-9 pb-6">
        <StatCardsSkeleton count={4} />
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSkeleton columns={4} rows={5} hasAvatarColumn />
          <TableSkeleton columns={4} rows={5} hasAvatarColumn />
        </div>
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
            Moderation Queue
          </h1>
          <p className="mt-2 max-w-[760px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live review surface for provider applications, trust-sensitive user accounts, and
            operational exceptions across bookings and sessions.
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
              <p className="mt-3 font-display text-[52px] font-semibold leading-none tracking-[-0.04em] text-[#2f6f5b]">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr_0.95fr]">
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <motion.h2
              variants={fadeBlock}
              className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
            >
              Application Reviews
            </motion.h2>
            <Link
              href="/admin/applications"
              className="text-sm font-semibold text-[#2f6f5b] transition-colors hover:text-[#243230]"
            >
              Open board
            </Link>
          </div>

          <div className="space-y-4">
            {applicationQueue.slice(0, 8).map((application) => (
              <motion.article
                key={application.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-white px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <UserAvatarCircle
                      name={application.user?.name}
                      email={application.user?.email}
                      image={application.user?.image}
                      className="h-10 w-10 shrink-0"
                      fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-[#2f745f] text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                        {application.user?.name ?? "Unnamed applicant"}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-text-primary/45">
                        {application.user?.email}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f3efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d896f]">
                    {toSentenceCase(application.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-primary/55">
                  {toSentenceCase(application.type)} • Submitted {formatShortDate(application.createdAt)}
                </p>
              </motion.article>
            ))}

            {applicationQueue.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No provider applications are waiting for moderation.
              </div>
            ) : null}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <motion.h2
              variants={fadeBlock}
              className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
            >
              Identity Watch
            </motion.h2>
            <Link
              href="/admin/users"
              className="text-sm font-semibold text-[#2f6f5b] transition-colors hover:text-[#243230]"
            >
              View users
            </Link>
          </div>

          <div className="space-y-4">
            {identityWatch.map((user) => (
              <motion.article
                key={user.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-white px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start gap-3">
                  <UserAvatarCircle
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    className="h-10 w-10 shrink-0"
                    fallbackClassName="bg-linear-to-br from-[#eef0f0] to-[#d5d9d9] text-[#4a5554] text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                      {user.name ?? user.email}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-text-primary/45">
                      {user.email}
                    </p>
                    <p className="mt-3 text-sm text-text-primary/55">
                      {toSentenceCase(user.role)} • Joined {formatShortDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}

            {identityWatch.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No unverified accounts are currently in the watch queue.
              </div>
            ) : null}
          </div>
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
            Operational Exceptions
          </motion.h2>

          <div className="space-y-4">
            {disruptedSessions.map((session) => (
              <motion.article
                key={session.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-white px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start gap-3">
                  <UserAvatarPair
                    participant={session.user}
                    provider={session.provider}
                    sizeClassName="h-10 w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                      {session.user?.name ?? "Participant"} with {session.provider?.name ?? "Provider"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-text-primary/45">
                      {toSentenceCase(session.status)} • {toSentenceCase(session.sessionMode)}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                      {formatDateTime(session.startTime)}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}

            {disruptedBookings.map((booking) => (
              <motion.article
                key={booking.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-[#fbfaf7] px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start gap-3">
                  <UserAvatarPair
                    participant={booking.user}
                    provider={booking.provider}
                    sizeClassName="h-10 w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                      {booking.user?.name ?? "Participant"} with {booking.provider?.name ?? "Provider"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-text-primary/45">
                      {toSentenceCase(booking.status)} • {toSentenceCase(booking.type)}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                      Updated {formatDateTime(booking.updatedAt)}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}

            {disruptedSessions.length === 0 && disruptedBookings.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No booking or session exceptions are active right now.
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
