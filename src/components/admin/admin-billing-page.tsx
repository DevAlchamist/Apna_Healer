"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarCircle, UserAvatarPair } from "@/components/dashboard/user-avatar-circle";
import { formatCurrency, formatDateTime, toSentenceCase } from "@/lib/display";
import type { ApiCareSession, ApiTransaction, ApiUser } from "@/types/api";
import { StatCardsSkeleton, TableSkeleton, SessionRowSkeleton } from "@/components/skeletons";

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

export function AdminBillingPage() {
  const payoutsQuery = useQuery({
    queryKey: ["admin-billing-payouts"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/admin/payouts?take=50"),
  });
  const usersQuery = useQuery({
    queryKey: ["admin-billing-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["admin-billing-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?scope=all&take=100"),
  });

  const payouts = useMemo(() => payoutsQuery.data ?? [], [payoutsQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const totals = useMemo(() => {
    const payoutVolume = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
    const walletAvailable = users.reduce(
      (sum, user) => sum + Number(user.wallet?.availableBalance ?? 0),
      0,
    );
    const walletHeld = users.reduce(
      (sum, user) => sum + Number(user.wallet?.heldBalance ?? 0),
      0,
    );
    const completedSessionVolume = sessions
      .filter((session) => session.status === "COMPLETED")
      .reduce((sum, session) => sum + Number(session.amount), 0);

    return {
      payoutVolume,
      walletAvailable,
      walletHeld,
      completedSessionVolume,
    };
  }, [payouts, sessions, users]);

  const stats = useMemo(
    () => [
      {
        label: "Payout Volume",
        value: formatCurrency(totals.payoutVolume),
        meta: `${payouts.length} successful payouts`,
      },
      {
        label: "Wallet Float",
        value: formatCurrency(totals.walletAvailable),
        meta: "Available balance across loaded wallets",
      },
      {
        label: "Held Balance",
        value: formatCurrency(totals.walletHeld),
        meta: "Funds currently reserved for pending bookings",
      },
      {
        label: "Completed Session Revenue",
        value: formatCurrency(totals.completedSessionVolume),
        meta: `${sessions.filter((session) => session.status === "COMPLETED").length} completed sessions`,
      },
    ],
    [payouts.length, sessions, totals],
  );

  const richestWallets = useMemo(
    () =>
      users
        .filter((user) => user.wallet)
        .sort(
          (left, right) =>
            Number(right.wallet?.availableBalance ?? 0) -
            Number(left.wallet?.availableBalance ?? 0),
        )
        .slice(0, 6),
    [users],
  );

  const recentCompletedSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.status === "COMPLETED")
        .sort(
          (left, right) =>
            new Date(right.startTime).getTime() - new Date(left.startTime).getTime(),
        )
        .slice(0, 6),
    [sessions],
  );

  const queryError =
    payoutsQuery.error?.message ?? usersQuery.error?.message ?? sessionsQuery.error?.message;

  const isPageLoading = payoutsQuery.isLoading || usersQuery.isLoading || sessionsQuery.isLoading;

  return (
    <div className="space-y-9 pb-6">
      {isPageLoading ? (
        <>
          <StatCardsSkeleton count={4} />
          <TableSkeleton columns={5} rows={6} hasAvatarColumn />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SessionRowSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
      <>
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
      >
        <motion.div variants={fadeBlock}>
          <h1 className="font-display text-[42px] font-semibold tracking-[-0.03em] text-[#243230] md:text-[52px]">
            Billing Operations
          </h1>
          <p className="mt-2 max-w-[760px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live finance snapshot for payouts, wallet balances, held funds, and revenue moving
            through session delivery.
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
              <p className="mt-3 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#2f6f5b]">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr_0.95fr]">
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
            Recent Payouts
          </motion.h2>

          <div className="space-y-4">
            {payouts.slice(0, 8).map((payout) => (
              <motion.article
                key={payout.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-white px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <UserAvatarCircle
                      name={payout.user?.name}
                      email={payout.user?.email}
                      image={payout.user?.image}
                      className="h-10 w-10 shrink-0"
                      fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-[#2f745f] text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                        {formatCurrency(payout.amount)}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-text-primary/45">
                        {payout.user?.name ?? "Platform beneficiary"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f3efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d896f]">
                    {toSentenceCase(payout.type)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-primary/55">
                  {payout.purpose.replaceAll("_", " ")}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                  {formatDateTime(payout.createdAt)}
                </p>
              </motion.article>
            ))}

            {payouts.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No payout records are available yet.
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
            Wallet Watch
          </motion.h2>

          <div className="space-y-4">
            {richestWallets.map((user) => (
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
                    fallbackClassName="bg-linear-to-br from-[#e8ded1] to-[#d4c0a8] text-[#6e5542] text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-semibold leading-6 text-[#243230]">
                      {user.name ?? user.email}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-text-primary/45">{user.email}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-text-primary/62">
                      <span>Available {formatCurrency(user.wallet?.availableBalance)}</span>
                      <span>Held {formatCurrency(user.wallet?.heldBalance)}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            {richestWallets.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No wallet records were loaded for the current user snapshot.
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
            Revenue Sessions
          </motion.h2>

          <div className="space-y-4">
            {recentCompletedSessions.map((session) => (
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
                      {toSentenceCase(session.sessionMode)} • {session.duration} mins
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#2f6f5b]">
                      {formatCurrency(session.amount)}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/28">
                      {formatDateTime(session.startTime)}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}

            {recentCompletedSessions.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                Completed sessions will appear here once the platform starts generating revenue.
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
      </>
      )}
    </div>
  );
}
