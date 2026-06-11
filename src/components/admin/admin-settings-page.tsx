"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate, toSentenceCase } from "@/lib/display";
import { SettingsBlocksSkeleton, StatCardsSkeleton } from "@/components/skeletons";
import type { ApiApplication, ApiProvider, ApiTransaction, ApiUser } from "@/types/api";

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

export function AdminSettingsPage() {
  const currentUserQuery = useQuery({
    queryKey: ["admin-settings-current-user"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });
  const usersQuery = useQuery({
    queryKey: ["admin-settings-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });
  const providersQuery = useQuery({
    queryKey: ["admin-settings-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=100"),
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-settings-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/applications?take=100"),
  });
  const payoutsQuery = useQuery({
    queryKey: ["admin-settings-payouts"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/admin/payouts?take=100"),
  });

  const currentUser = currentUserQuery.data;
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const payouts = useMemo(() => payoutsQuery.data ?? [], [payoutsQuery.data]);

  const totals = useMemo(() => {
    const walletAvailable = users.reduce(
      (sum, user) => sum + Number(user.wallet?.availableBalance ?? 0),
      0,
    );
    const walletHeld = users.reduce(
      (sum, user) => sum + Number(user.wallet?.heldBalance ?? 0),
      0,
    );

    return {
      walletAvailable,
      walletHeld,
    };
  }, [users]);

  const stats = useMemo(
    () => [
      {
        label: "Admin Access",
        value: currentUser ? toSentenceCase(currentUser.role) : "Loading",
        meta: currentUser?.email ?? "Resolving session identity",
      },
      {
        label: "Verified Providers",
        value: String(providers.length),
        meta: `${providers.filter((provider) => provider.nextAvailabilityDate).length} with published availability`,
      },
      {
        label: "Open Applications",
        value: String(
          applications.filter(
            (application) =>
              application.status === "PENDING",
          ).length,
        ),
        meta: `${applications.filter((application) => application.status === "APPROVED").length} approved`,
      },
      {
        label: "Wallet Float",
        value: formatCurrency(totals.walletAvailable),
        meta: `${formatCurrency(totals.walletHeld)} held in booking reserves`,
      },
    ],
    [applications, currentUser, providers, totals.walletAvailable, totals.walletHeld],
  );

  const queryError =
    currentUserQuery.error?.message ??
    usersQuery.error?.message ??
    providersQuery.error?.message ??
    applicationsQuery.error?.message ??
    payoutsQuery.error?.message;

  const isPageLoading =
    currentUserQuery.isLoading ||
    usersQuery.isLoading ||
    providersQuery.isLoading ||
    applicationsQuery.isLoading ||
    payoutsQuery.isLoading;

  if (isPageLoading) {
    return (
      <div className="space-y-9 pb-6">
        <StatCardsSkeleton count={4} />
        <SettingsBlocksSkeleton />
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
          <h1 className="font-display text-[42px] font-semibold tracking-[-0.03em] text-theme-heading md:text-[52px]">
            Settings Snapshot
          </h1>
          <p className="mt-2 max-w-[780px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live operational overview of the current platform configuration. This page is read-only
            for now and reflects the behavior already enforced by auth, middleware, wallet, and
            provider flows.
          </p>
          <Link
            href="/admin/settings/themes"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-theme-status-success hover:underline"
          >
            Theme Management →
          </Link>
        </motion.div>

        {queryError ? (
          <div className="mt-6 rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]">
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
              <p className="mt-3 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-theme-status-success">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <motion.h2
            variants={fadeBlock}
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading"
          >
            Access Control
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="space-y-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-theme-heading">Current admin:</span>{" "}
                {currentUser?.name ?? currentUser?.email ?? "Loading"}
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Admin zone protection:</span>{" "}
                enforced through authenticated role checks and middleware.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Verified accounts:</span>{" "}
                {users.filter((user) => user.isVerified).length} of {users.length} loaded users.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Latest admin-visible account:</span>{" "}
                {users[0] ? formatShortDate(users[0].createdAt) : "Not available"}
              </p>
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
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading"
          >
            Provider Enablement
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="space-y-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-theme-heading">Approved providers:</span>{" "}
                {providers.length} verified directory entries.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Open application pressure:</span>{" "}
                {
                  applications.filter(
                    (application) =>
                      application.status === "PENDING",
                  ).length
                }{" "}
                records currently need review.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Availability adoption:</span>{" "}
                {providers.filter((provider) => provider.nextAvailabilityDate).length} providers
                currently expose at least one open day.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Pricing coverage:</span>{" "}
                {providers.filter((provider) => provider.hourlyRate).length} providers have session
                rates configured.
              </p>
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
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading"
          >
            Finance Rules
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="space-y-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-theme-heading">Wallet float:</span>{" "}
                {formatCurrency(totals.walletAvailable)} available across loaded wallets.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Held balances:</span>{" "}
                {formatCurrency(totals.walletHeld)} currently reserved for pending bookings.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Payout ledger:</span>{" "}
                {payouts.length} successful payout events loaded from the settlement stream.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Settlement model:</span>{" "}
                immutable transaction records back wallet movements and session payouts.
              </p>
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
            className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading"
          >
            Platform Notes
          </motion.h2>

          <motion.article
            variants={fadeBlock}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="space-y-4 text-sm text-text-primary/62">
              <p>
                <span className="font-semibold text-theme-heading">Authentication:</span> Google sign-in
                with enriched session roles and wallet identity.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Provider lifecycle:</span>{" "}
                application review promotes roles and creates the matching profile records.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Export posture:</span> client-side
                exports are available for loaded admin datasets in the export center.
              </p>
              <p>
                <span className="font-semibold text-theme-heading">Most recent payout:</span>{" "}
                {payouts[0] ? formatShortDate(payouts[0].createdAt) : "Not available"}
              </p>
            </div>
          </motion.article>
        </motion.section>
      </div>
    </div>
  );
}
