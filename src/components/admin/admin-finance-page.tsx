"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { formatCurrency, formatSentAgo, toSentenceCase } from "@/lib/display";
import type {
  AdminFinanceDashboard,
  TransactionStatusValue,
  TransactionTypeValue,
} from "@/types/api";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};

type StatusFilter = "" | TransactionStatusValue;
type TypeFilter = "" | TransactionTypeValue;

function StatIcon({ variant }: { variant: "revenue" | "healers" | "reports" }) {
  const className = "h-5 w-5";
  if (variant === "revenue") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M5 15.5 10 10l3.2 3.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.5 7.5H19v3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === "healers") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 19.5c.8-3 3.2-4.5 6.5-4.5s5.7 1.5 6.5 4.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function MethodIcon({ method }: { method: string }) {
  const label = method.toLowerCase();
  if (label.includes("payout") || label.includes("direct")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
        <path d="M2.5 10.5h19" />
      </svg>
    );
  }
  if (label.includes("refund")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 12a8 8 0 0 1 13.5-5.7M20 12v-4M20 12h-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z" />
    </svg>
  );
}

function getStatusClasses(status: TransactionStatusValue) {
  if (status === "SUCCESS") return "bg-[#d8f5e8] text-[#2f745f]";
  if (status === "PENDING") return "bg-[#ece8e1] text-[#7a756c]";
  return "bg-[#fde1de] text-[#cf4f45]";
}

function exportTransactionsCsv(items: AdminFinanceDashboard["items"]) {
  const header = ["User", "Email", "Counterparty", "Transaction ID", "Method", "Amount", "Status", "Purpose", "Date"];
  const rows = items.map((row) => [
    row.user?.name ?? "",
    row.user?.email ?? "",
    row.counterpartyLabel,
    row.displayId,
    row.method,
    row.amount,
    row.status,
    row.purpose,
    row.createdAt,
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `apna-healer-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminFinancePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const financeQuery = useQuery({
    queryKey: ["admin-finance", statusFilter, typeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), take: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      return apiFetch<AdminFinanceDashboard>(`/api/admin/finance?${params}`);
    },
  });

  const data = financeQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statCards = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(data?.stats.totalRevenue ?? 0),
        meta:
          data?.stats.revenueDeltaPercent != null
            ? `${data.stats.revenueDeltaPercent >= 0 ? "+" : ""}${data.stats.revenueDeltaPercent}% from last month`
            : "Lifetime platform volume",
        icon: "revenue" as const,
        iconTone: "bg-[#d8f5e8] text-[#2f745f]",
      },
      {
        label: "Active Healers",
        value: String(data?.stats.activeHealers ?? 0),
        meta: `${data?.stats.newHealersThisWeek ?? 0} new registrations this week`,
        icon: "healers" as const,
        iconTone: "bg-[#e4edf5] text-[#3a5a72]",
      },
      {
        label: "Pending Reports",
        value: String(data?.stats.pendingReports ?? 0),
        meta: "Needs urgent review",
        metaTone: "text-[#cf4f45]",
        icon: "reports" as const,
        iconTone: "bg-[#fde8e6] text-[#cf4f45]",
      },
    ],
    [data?.stats],
  );

  const chartBars = data?.chart ?? [];
  const maxBar = Math.max(...chartBars.flatMap((b) => [b.earnings, b.processing]), 1);

  return (
    <motion.div className="space-y-8 pb-10" initial="hidden" animate="show" variants={containerVariants}>
      <motion.div variants={fadeUp} className="grid gap-5 lg:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[24px] border border-[#f0eeea] bg-white px-6 py-6 shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]"
          >
            <motion.div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-text-primary/55">{card.label}</p>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.iconTone}`}>
                <StatIcon variant={card.icon} />
              </span>
            </motion.div>
            <p className="mt-5 font-display text-[40px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
              {financeQuery.isLoading && !financeQuery.data ? (
                <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-[#ece8e0]/90" />
              ) : (
                card.value
              )}
            </p>
            <p className={`mt-2 text-sm ${card.metaTone ?? "text-text-primary/50"}`}>{card.meta}</p>
          </article>
        ))}
      </motion.div>

      {financeQuery.error ? (
        <motion.p variants={fadeUp} className="rounded-[22px] bg-white px-5 py-4 text-sm font-medium text-[#cf4f45] shadow-soft">
          {financeQuery.error.message}
        </motion.p>
      ) : null}

      <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-[28px] border border-[#f0eeea] bg-white shadow-[0_18px_44px_-30px_rgba(47,63,56,0.16)]">
          <div className="flex flex-col gap-4 border-b border-[#f0ebe3] px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-[32px] font-semibold tracking-[-0.03em] text-[#243230]">
                Transaction Logs
              </h1>
              <p className="mt-1 text-sm text-text-primary/55">
                Real-time payment and wallet processing
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportTransactionsCsv(items)}
                disabled={items.length === 0}
                className="rounded-full border border-[#e5dfd4] bg-white px-4 py-2 text-sm font-semibold text-[#243230] transition hover:border-[#c9bfb0] disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="rounded-full bg-[#243230] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2826]"
              >
                Filters
              </button>
            </div>
          </div>

          {showFilters ? (
            <div className="flex flex-wrap gap-3 border-b border-[#f0ebe3] bg-[#faf8f5] px-6 py-4">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
                Status
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="mt-1 block rounded-lg border border-[#e5dfd4] bg-white px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="SUCCESS">Completed</option>
                  <option value="PENDING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
                Type
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as TypeFilter);
                    setPage(1);
                  }}
                  className="mt-1 block rounded-lg border border-[#e5dfd4] bg-white px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="SESSION_PAYMENT">Session payment</option>
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                  <option value="PAYOUT">Payout</option>
                  <option value="REFUND">Refund</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="border-b border-[#f0ebe3] bg-[#f7f5f1] px-6 py-6">
            <div className="mb-4 flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary/45">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3e725f]" />
                Earnings
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#d4cfc6]" />
                Processing
              </span>
            </div>
            <div className="flex h-36 items-end justify-between gap-2">
              {chartBars.map((bar, index) => (
                <motion.div key={index} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex w-full max-w-[48px] items-end justify-center gap-1">
                    <motion.div
                      initial={{ height: 4 }}
                      animate={{ height: Math.max(12, (bar.processing / maxBar) * 120) }}
                      className="w-3 rounded-t-md bg-[#d4cfc6]"
                    />
                    <motion.div
                      initial={{ height: 4 }}
                      animate={{ height: Math.max(16, (bar.earnings / maxBar) * 120) }}
                      className="w-4 rounded-t-md bg-[#3e725f]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead>
                <tr className="border-b border-[#f0ebe3] text-left">
                  {["User / Healer", "Transaction ID", "Method", "Amount", "Status"].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a48f7a]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financeQuery.isLoading && !financeQuery.data ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <TableSkeleton columns={5} rows={6} hasAvatarColumn className="border-0 shadow-none" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-primary/50">
                      No transactions match this filter.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="border-b border-[#f4f0ea] transition hover:bg-[#fcfbf8]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatarCircle
                            name={row.user?.name}
                            email={row.user?.email}
                            image={row.user?.image}
                            className="h-10 w-10"
                            fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-[#2f745f] text-xs"
                          />
                          <motion.div>
                            <p className="font-semibold text-[#243230]">{row.user?.name ?? "Member"}</p>
                            <p className="text-xs text-text-primary/45">{row.counterpartyLabel}</p>
                            <Link
                              href={`/admin/users`}
                              className="mt-0.5 text-[10px] font-medium text-[#3e725f] hover:underline"
                            >
                              User ID: {row.userId.slice(-8)}
                            </Link>
                          </motion.div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#243230]">{row.displayId}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-text-primary/70">
                          <MethodIcon method={row.method} />
                          {row.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#243230]">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getStatusClasses(
                            row.status,
                          )}`}
                        >
                          {row.status === "SUCCESS" ? "Completed" : toSentenceCase(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#f0ebe3] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-primary/55">
              Showing page {page} of {totalPages} · {total} transactions
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || financeQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-text-primary/55 hover:bg-[#f0ebe3] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || financeQuery.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-text-primary/55 hover:bg-[#f0ebe3] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#f0eeea] bg-white p-6 shadow-[0_18px_44px_-30px_rgba(47,63,56,0.16)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-[#243230]">
                  Reports
                </h2>
                <p className="mt-1 text-sm text-text-primary/55">Community moderation queue</p>
              </div>
              <span className="rounded-full bg-[#fde8e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#cf4f45]">
                Live
              </span>
            </div>

            <motion.div className="mt-5 space-y-4">
              {(data?.reports ?? []).length > 0 ? (
                data?.reports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-[18px] border border-[#f0ebe3] bg-[#faf8f5] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#fde8e6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#cf4f45]">
                        {report.status}
                      </span>
                      <span className="text-[11px] text-text-primary/40">
                        {formatSentAgo(report.occurredAt)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold text-[#243230]">{report.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-text-primary/55">{report.description}</p>
                    <Link
                      href={report.href}
                      className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.1em] text-[#3e725f] hover:underline"
                    >
                      Review now
                    </Link>
                  </article>
                ))
              ) : (
                <p className="rounded-[18px] bg-[#faf8f5] px-4 py-6 text-sm text-text-primary/55">
                  No urgent reports in the queue right now.
                </p>
              )}
            </motion.div>

            <Link
              href="/admin/moderation"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3e725f] hover:gap-3"
            >
              View full queue
              <span aria-hidden>→</span>
            </Link>
          </section>

          <section className="rounded-[22px] bg-[#f4f2ed] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary/45">
              Member expenditure
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-[#243230]">
              {formatCurrency(data?.expenditureSummary.totalWalletSpent ?? 0)}
            </p>
            <p className="mt-1 text-xs text-text-primary/50">Total spent across all wallets</p>
            <p className="mt-4 text-sm text-text-primary/55">
              {formatCurrency(data?.expenditureSummary.totalWalletHeld ?? 0)} currently held for pending bookings
            </p>
          </section>
        </aside>
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
        <article className="flex flex-col rounded-[28px] bg-[#3f735f] px-7 py-7 text-white shadow-[0_16px_42px_-26px_rgba(63,115,95,0.42)]">
          <h2 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Quarterly Projection</h2>
          <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-white/80">
            Based on current healer growth and session volume, platform revenue is tracking at{" "}
            {formatCurrency(data?.stats.totalRevenue ?? 0)} lifetime with{" "}
            {data?.stats.activeHealers ?? 0} active care providers on the network.
          </p>
          <Link
            href="/admin/exports"
            className="mt-auto inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3f735f] transition hover:bg-white/95"
          >
            Download analysis
          </Link>
        </article>

        <article className="flex flex-col items-center justify-center rounded-[28px] bg-[#f4f2ed] px-6 py-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#3f735f] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold text-[#2c5e4f]">Secure Vault</h3>
          <p className="mt-2 text-sm text-text-primary/55">Manage encryption keys for wallet storage</p>
          <Link href="/admin/settings" className="mt-4 text-sm font-semibold text-[#3e725f] hover:underline">
            Open settings
          </Link>
        </article>

        <article className="flex flex-col justify-center rounded-[28px] bg-[#f4f2ed] px-6 py-8">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3e725f]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7.5v4.8l3 1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Last sync
          </p>
          <p className="mt-3 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#243230]">
            {financeQuery.dataUpdatedAt
              ? new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(
                  new Date(financeQuery.dataUpdatedAt),
                )
              : "—"}
          </p>
          <p className="mt-2 text-sm text-text-primary/50">
            {financeQuery.isFetching ? "Refreshing ledger…" : "Ledger data current"}
          </p>
        </article>
      </motion.div>
    </motion.div>
  );
}
