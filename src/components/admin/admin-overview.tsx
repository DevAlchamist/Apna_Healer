"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate } from "@/lib/display";
import { AdminOverviewSkeleton } from "@/components/skeletons";
import type { AdminControlCenterDashboard } from "@/types/api";

const viewport = { once: true, amount: 0.2 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeBlock = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const intlCompact = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function formatSignedPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function SegmentedMeter({
  filled,
  activeClassName,
  mutedClassName,
}: {
  filled: number;
  activeClassName: string;
  mutedClassName: string;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${i < filled ? activeClassName : mutedClassName}`}
        />
      ))}
    </div>
  );
}

function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5l7 7h-4v7h-6v-7H5l7-7z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L2 21h20L12 3zm0 4.2L18.4 19H5.6L12 7.2zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AdminOverview() {
  const overviewQuery = useQuery({
    queryKey: ["admin-control-center"],
    queryFn: () => apiFetch<AdminControlCenterDashboard>("/api/admin/overview"),
  });

  const data = overviewQuery.data;
  const errorMessage = overviewQuery.error?.message;

  if (errorMessage) {
    return (
      <div className="rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-[#cf4f45] shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]">
        {errorMessage}
      </div>
    );
  }

  if (!data) {
    return <AdminOverviewSkeleton />;
  }

  const { kpis, needsAttention, financial, supplyHealth, integrations, header } = data;

  const revenueBadge =
    kpis.revenueGrowthPercent != null
      ? `${kpis.revenueGrowthPercent >= 0 ? "+" : ""}${kpis.revenueGrowthPercent.toFixed(1)}%`
      : kpis.revenueDeltaAmount >= 0
        ? `+${formatCurrency(kpis.revenueDeltaAmount)}`
        : formatCurrency(kpis.revenueDeltaAmount);

  const queueBadgeLabel =
    kpis.queueSeverity === "critical"
      ? "Critical"
      : kpis.queueSeverity === "warning"
        ? "Attention"
        : "Clear";

  const queueBadgeStyles =
    kpis.queueSeverity === "critical"
      ? "bg-[#fde8e6] text-[#b42318]"
      : kpis.queueSeverity === "warning"
        ? "bg-[#fff4e5] text-[#b54708]"
        : "bg-[#e6f4ef] text-[#2f6f5b]";

  return (
    <div className="space-y-10 pb-8">
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
        className="space-y-8"
      >
        <motion.div variants={fadeBlock} className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230] md:text-[42px]">
              {header.title}
            </h1>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-[#5c574f] md:text-base">
              {header.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/admin/audit"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#ddd6cc] bg-white px-5 text-[14px] font-semibold text-[#3d3832] shadow-sm transition hover:bg-[#faf8f5]"
            >
              Generate Audit
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f6f5b] px-5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-16px_rgba(47,111,91,0.65)] transition hover:bg-[#285c4c]"
            >
              <IconBolt className="text-white opacity-95" />
              System Action
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <motion.article
            variants={fadeBlock}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-38px_rgba(47,63,56,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9288]">
                Total users
              </span>
              {kpis.userGrowthPercent != null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2.5 py-1 text-[12px] font-semibold text-[#2f6f5b]">
                  <IconArrowUp className="text-[#2f6f5b]" />
                  {formatSignedPercent(kpis.userGrowthPercent)}
                </span>
              ) : null}
            </div>
            <p className="mt-5 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
              {intlCompact.format(kpis.totalUsers)}
            </p>
            <p className="mt-2 text-sm text-[#7a7268]">
              <span className="font-medium text-[#3d3832]">
                {intlCompact.format(kpis.monthlyActiveUsers)}
              </span>{" "}
              monthly active
            </p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#efe9e0]">
              <div
                className="h-full rounded-full bg-[#6aab8e] transition-[width] duration-500"
                style={{ width: `${kpis.mauFillPercent}%` }}
              />
            </div>
          </motion.article>

          <motion.article
            variants={fadeBlock}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-38px_rgba(47,63,56,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9288]">
                Active sessions
              </span>
              {kpis.sessionGrowthPercent != null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2.5 py-1 text-[12px] font-semibold text-[#2f6f5b]">
                  <IconArrowUp className="text-[#2f6f5b]" />
                  {formatSignedPercent(kpis.sessionGrowthPercent)}
                </span>
              ) : null}
            </div>
            <p className="mt-5 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
              {intlCompact.format(kpis.activeSessions)}
            </p>
            <p className="mt-2 text-sm text-[#7a7268]">
              <span className="font-medium text-[#3d3832]">Live now</span> · listener &amp; therapist
            </p>
            <div className="mt-5 flex h-10 items-end justify-between gap-1 px-1">
              {kpis.sessionSparkline.map((h, i) => (
                <div
                  key={i}
                  className="w-full max-w-[48px] rounded-t-md bg-[#7eb89e]"
                  style={{ height: `${Math.max(h * 0.32, 10)}px` }}
                />
              ))}
            </div>
          </motion.article>

          <motion.article
            variants={fadeBlock}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-38px_rgba(47,63,56,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9288]">
                Platform revenue
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2.5 py-1 text-[12px] font-semibold text-[#2f6f5b]">
                <IconArrowUp className="text-[#2f6f5b]" />
                {revenueBadge}
              </span>
            </div>
            <p className="mt-5 font-display text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
              {formatCurrency(kpis.grossRevenueMonth)}
            </p>
            <p className="mt-2 text-sm text-[#7a7268]">Gross / Mo · session settlements</p>
            {kpis.nextPayoutDate ? (
              <p className="mt-4 text-[13px] italic text-[#8a8278]">
                Next payout (est.): {formatShortDate(kpis.nextPayoutDate)}
              </p>
            ) : (
              <p className="mt-4 text-[13px] italic text-[#8a8278]">No pending payout batch</p>
            )}
          </motion.article>

          <motion.article
            variants={fadeBlock}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-38px_rgba(47,63,56,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9288]">
                Active queues
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${queueBadgeStyles}`}
              >
                {kpis.queueSeverity === "critical" ? (
                  <IconAlert className="opacity-90" />
                ) : (
                  <IconArrowUp className="opacity-70" />
                )}
                {queueBadgeLabel}
              </span>
            </div>
            <p className="mt-5 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
              {intlCompact.format(kpis.activeQueuesTotal)}
            </p>
            <p className="mt-2 text-sm text-[#7a7268]">Action items across review queues</p>
            <div className="mt-5 flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fde8e6] text-[13px] font-bold text-[#b42318]"
                title="Critical path"
              >
                {kpis.queueBreakdown.critical}
              </span>
              <span
                className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4e5] text-[13px] font-bold text-[#b54708] ring-2 ring-white"
                title="Needs triage"
              >
                {kpis.queueBreakdown.warning}
              </span>
              <span
                className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#e8eef9] text-[13px] font-bold text-[#3552a0] ring-2 ring-white"
                title="Routine backlog"
              >
                {kpis.queueBreakdown.info}
              </span>
            </div>
          </motion.article>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
        className="grid gap-6 lg:grid-cols-2"
      >
        <motion.div variants={fadeBlock} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#243230]">
              Needs attention
            </h2>
            <Link
              href="/admin/applications"
              className="text-[13px] font-semibold text-[#2f745f] underline-offset-4 transition hover:underline"
            >
              View all queues
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="rounded-[24px] border border-[#eee9e1] bg-white p-5 shadow-[0_14px_40px_-36px_rgba(47,63,56,0.28)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9288]">
                Onboarding
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-[#7a7268]">Healers</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#e8f5ef] px-3 py-1 text-[18px] font-semibold text-[#2f6f5b]">
                      {needsAttention.onboarding.healers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7268]">Listeners</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#e8f5ef] px-3 py-1 text-[18px] font-semibold text-[#2f6f5b]">
                      {needsAttention.onboarding.listeners}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/applications"
                  className="rounded-full border border-[#d5cfc4] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#3d3832] transition hover:bg-[#faf8f5]"
                >
                  Process
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#eee9e1] border-l-4 border-l-[#e07066] bg-white p-5 shadow-[0_14px_40px_-36px_rgba(47,63,56,0.28)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9288]">
                Flagged content
              </p>
              <p className="mt-1 text-[13px] text-[#7a7268]">
                Identity &amp; session incidents (30d)
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-[#7a7268]">Unverified</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#fde8e6] px-3 py-1 text-[18px] font-semibold text-[#b42318]">
                      {needsAttention.flagged.communities}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7268]">Incidents</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#fde8e6] px-3 py-1 text-[18px] font-semibold text-[#b42318]">
                      {needsAttention.flagged.dmReports}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/moderation"
                  className="rounded-full border border-[#d5cfc4] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#3d3832] transition hover:bg-[#faf8f5]"
                >
                  Review
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#eee9e1] bg-white p-5 shadow-[0_14px_40px_-36px_rgba(47,63,56,0.28)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9288]">
                Support
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-[#7a7268]">Open tickets</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#fff4e5] px-3 py-1 text-[18px] font-semibold text-[#b54708]">
                      {needsAttention.support.openTickets}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7268]">No-shows (7d)</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#fde8e6] px-3 py-1 text-[18px] font-semibold text-[#b42318]">
                      {needsAttention.support.criticalBugs}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/sessions"
                  className="rounded-full border border-[#d5cfc4] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#3d3832] transition hover:bg-[#faf8f5]"
                >
                  Resolve
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeBlock}>
          <div className="flex h-full flex-col rounded-[28px] border border-[#e6dcc8] bg-[#f4f0e8] p-6 shadow-[0_18px_48px_-38px_rgba(47,63,56,0.25)]">
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#3d3832]">
              Financial snapshot
            </h2>
            <p className="mt-1 text-[13px] text-[#7a7268]">Rolling wallet &amp; settlement view</p>

            <p className="mt-8 font-display text-[36px] font-semibold leading-none tracking-[-0.03em] text-[#243230]">
              {financial.netFlow24h >= 0 ? "+" : ""}
              {formatCurrency(financial.netFlow24h)}
            </p>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
              Net flow (24h)
            </p>

            <div className="mt-8 space-y-4 border-t border-[#e3d8c8] pt-6">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-[#5c574f]">Pending payouts</span>
                <span className="font-semibold text-[#243230]">
                  {formatCurrency(financial.pendingPayouts)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-[#5c574f]">Refund requests</span>
                <span className="font-semibold text-[#b42318]">
                  {formatCurrency(financial.refundRequests)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-[#5c574f]">Reconciliation</span>
                <span className="inline-flex items-center gap-2 font-semibold text-[#2f6f5b]">
                  {financial.reconciliationStatus === "verified" ? (
                    <>
                      <IconCheck className="text-[#2f6f5b]" />
                      Verified
                    </>
                  ) : (
                    <>
                      <IconAlert className="text-[#b54708]" />
                      Review
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Link
                href="/admin/finance"
                className="flex w-full items-center justify-center rounded-2xl bg-[#2f422f] py-3.5 text-[14px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#26362a]"
              >
                Access ledger
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
        className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"
      >
        <motion.div
          variants={fadeBlock}
          className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-40px_rgba(47,63,56,0.3)]"
        >
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#243230]">
            Supply-side health
          </h2>
          <p className="mt-1 text-[13px] text-[#7a7268]">
            Healer &amp; listener readiness · from live profiles
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-[#efe9e0]">
            <div className="sm:pr-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9288]">
                Provider coverage
              </p>
              <p className="mt-3 font-display text-[38px] font-semibold text-[#2f6f5b]">
                {supplyHealth.providerCoveragePercent}%
              </p>
              <p className="mt-1 text-[13px] text-[#6a655d]">Peak ready</p>
              <div className="mt-4">
                <SegmentedMeter
                  filled={supplyHealth.coverageSegments}
                  activeClassName="bg-[#2f6f5b]"
                  mutedClassName="bg-[#dfe8df]"
                />
              </div>
            </div>

            <div className="sm:px-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9288]">
                Quality score
              </p>
              <p className="mt-3 font-display text-[38px] font-semibold text-[#2f6f5b]">
                {supplyHealth.qualityScore.toFixed(2)}
              </p>
              <p className="mt-1 text-[13px] text-[#6a655d]">Avg rating</p>
              <div className="mt-4">
                <SegmentedMeter
                  filled={supplyHealth.qualitySegments}
                  activeClassName="bg-[#8bc4a3]"
                  mutedClassName="bg-[#e3efe6]"
                />
              </div>
            </div>

            <div className="sm:pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a9288]">
                Burnout risk
              </p>
              <p className="mt-3 font-display text-[38px] font-semibold text-[#5c574f]">
                {supplyHealth.burnoutLabel}
              </p>
              <p className="mt-1 text-[13px] text-[#6a655d]">
                {supplyHealth.burnoutHoursAvg} hrs / avg session
              </p>
              <div className="mt-4">
                <SegmentedMeter
                  filled={supplyHealth.burnoutSegments}
                  activeClassName="bg-[#c6cfc8]"
                  mutedClassName="bg-[#ece8e0]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeBlock}
          className="rounded-[28px] border border-[#eee9e1] bg-white p-6 shadow-[0_18px_48px_-40px_rgba(47,63,56,0.3)]"
        >
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#243230]">
            System integration
          </h2>
          <p className="mt-1 text-[13px] text-[#7a7268]">
            Operational signals · payments &amp; sessions
          </p>

          <ul className="mt-6 space-y-5">
            {integrations.map((row) => {
              const barColor =
                row.status === "healthy"
                  ? "bg-[#6aab8e]"
                  : row.status === "warning"
                    ? "bg-[#e3a53d]"
                    : "bg-[#e07066]";
              const dotColor =
                row.status === "healthy"
                  ? "bg-[#2f6f5b]"
                  : row.status === "warning"
                    ? "bg-[#e3a53d]"
                    : "bg-[#e07066]";
              return (
                <li key={row.id}>
                  <div className="flex items-center justify-between gap-3 text-[14px] font-medium text-[#3d3832]">
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                      {row.label}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums text-[#5c574f]">
                      {row.percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efe9e0]">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${clampPercent(row.percent)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] text-[#8a8278]">{row.detail}</p>
                </li>
              );
            })}
          </ul>

          <Link
            href="/admin/settings"
            className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2f745f] underline-offset-4 transition hover:underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#2f745f]" aria-hidden>
              <path
                fill="currentColor"
                d="M4 19h16v-2H4v2zm0-6h16v-2H4v2zm0-6V5H2v2h2zm4 0h12V5H8v2zm-4 8h16v-2H4v2zm0-4h12V9H4v2z"
              />
            </svg>
            Infrastructure metrics
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}

function clampPercent(n: number) {
  return Math.min(100, Math.max(6, n));
}
