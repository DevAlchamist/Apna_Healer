"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import {
  formatCurrency,
  getInitials,
  toSentenceCase,
} from "@/lib/display";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";
import type {
  AdminOperationsRow,
  AdminSessionsDashboard,
  ApiCareSession,
  BookingStatusValue,
  CareSessionStatusValue,
} from "@/types/api";

const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

const AVATAR_TONES = [
  "bg-[#c5e8e0] text-[#2a6b5c]",
  "bg-[#e8dfd0] text-[#7a5c3a]",
  "bg-[#f0d4dc] text-[#8a4a5a]",
  "bg-[#d8dde3] text-[#4a5c66]",
  "bg-[#dce8f0] text-[#3a5a72]",
] as const;

type OperationsStatusFilter = "" | CareSessionStatusValue | BookingStatusValue;

const STATUS_OPTIONS: Array<{ value: OperationsStatusFilter; label: string }> = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending approval" },
  { value: "ACCEPTED", label: "Accepted (booking)" },
  { value: "REJECTED", label: "Rejected (booking)" },
  { value: "UPCOMING", label: "Upcoming (session)" },
  { value: "ONGOING", label: "Ongoing (session)" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MISSED", label: "No-show (session)" },
];

const tableDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const tableTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
});

function toInputDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: toInputDate(from), to: toInputDate(to) };
}

function formatRangeLabel(from: string, to: string) {
  if (!from || !to) return "All Time";
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  try {
    const dFrom = new Date(from);
    const dTo = new Date(to);
    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) return "All Time";
    return `${fmt.format(dFrom)} — ${fmt.format(dTo)}`;
  } catch {
    return "All Time";
  }
}

function clientIdLabel(userId: string) {
  const tail = userId.replace(/\D/g, "").slice(-4) || userId.slice(-4);
  return `#${tail.padStart(4, "0")}`;
}

function getSessionStatusClasses(status: CareSessionStatusValue) {
  if (status === "UPCOMING" || status === "ONGOING") {
    return "bg-[#c9f2df] text-theme-status-success";
  }
  if (status === "COMPLETED") {
    return "bg-[#d9f0df] text-[#3e805f]";
  }
  if (status === "CANCELLED") {
    return "bg-[#fde1de] text-theme-status-error";
  }
  return "bg-[#ece8e1] text-[#8e8b84]";
}

function getBookingStatusClasses(status: BookingStatusValue) {
  if (status === "PENDING") return "bg-[#fff3d6] text-[#8a6a1f]";
  if (status === "ACCEPTED") return "bg-[#c9f2df] text-theme-status-success";
  if (status === "COMPLETED") return "bg-[#d9f0df] text-[#3e805f]";
  if (status === "REJECTED" || status === "CANCELLED") {
    return "bg-[#fde1de] text-theme-status-error";
  }
  return "bg-[#ece8e1] text-[#8e8b84]";
}

function displaySessionStatus(status: CareSessionStatusValue) {
  if (status === "MISSED") return "No-show";
  if (status === "ONGOING") return "Active";
  return toSentenceCase(status);
}

function displayBookingStatus(status: BookingStatusValue) {
  return toSentenceCase(status);
}

function SessionStatIcon({ icon }: { icon: "trend" | "pulse" | "bolt" | "clock" }) {
  const className = "h-5 w-5";
  if (icon === "trend") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M5 15.5 10 10l3.2 3.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.5 7.5H19v3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "pulse") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 12h4l2.1-5 3.8 10L15 12h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "bolt") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M13 2 6.5 12h4l-1 10L16.5 12h-4L13 2Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v4.8l3 1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const { open: openSessionDetails } = useSessionDetailsModal();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationsStatusFilter>("");
  const [page, setPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = ["admin-sessions-dashboard", dateFrom, dateTo, statusFilter, page] as const;

  const dashboardQuery = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        take: "10",
      });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (statusFilter) params.set("status", statusFilter);
      return apiFetch<AdminSessionsDashboard>(`/api/admin/sessions?${params}`);
    },
  });

  const refreshDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-sessions-dashboard"] });
  };

  const bookingMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "ACCEPTED" | "REJECTED" | "CANCELLED";
    }) => apiMutation(`/api/bookings/${bookingId}`, "PATCH", { status }),
    onSuccess: () => {
      setActionError(null);
      refreshDashboard();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const sessionMutation = useMutation({
    mutationFn: ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: "ONGOING" | "COMPLETED" | "CANCELLED";
    }) => apiMutation(`/api/sessions/${sessionId}`, "PATCH", { status }),
    onSuccess: () => {
      setActionError(null);
      refreshDashboard();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const isMutating = bookingMutation.isPending || sessionMutation.isPending;

  const data = dashboardQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const statCards = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(data?.stats.totalRevenue ?? 0),
        icon: "trend" as const,
        tone: "default" as const,
      },
      {
        label: "Active Sessions",
        value: String(data?.stats.activeSessions ?? 0),
        icon: "pulse" as const,
        tone: "default" as const,
      },
      {
        label: "Pending Approvals",
        value: String(data?.stats.pendingBookings ?? 0),
        icon: "bolt" as const,
        tone: "mint" as const,
      },
      {
        label: "Avg. Duration",
        value: `${data?.stats.avgDurationMinutes ?? 0} min`,
        icon: "clock" as const,
        tone: "default" as const,
      },
    ],
    [data?.stats],
  );

  const satisfactionRating = data?.satisfaction.averageRating;
  const satisfactionText =
    satisfactionRating != null
      ? `Real-time aggregate feedback from completed sessions indicates a steady ${satisfactionRating}/5 average for clinical interventions.`
      : "Session reviews will appear here once members complete sessions and leave feedback.";

  return (
    <motion.div
      className="space-y-7 pb-8"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <motion.div>
          <h1 className="font-display text-[40px] font-semibold tracking-[-0.03em] text-theme-heading md:text-[48px]">
            Session Management
          </h1>
          <p className="mt-2 max-w-[720px] text-[15px] leading-7 text-text-primary/62">
            Approve booking requests, manage live sessions, and track payments in one unified operations
            table.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5dfd4] bg-white px-4 py-2.5 text-sm font-medium text-theme-heading shadow-[0_8px_20px_-14px_rgba(47,63,56,0.2)] transition hover:border-[#c9bfb0]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#7d8f88]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
              </svg>
              {formatRangeLabel(dateFrom, dateTo)}
            </button>
            {showDatePicker ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 z-20 mt-2 w-72 rounded-[18px] border border-[#ece7df] bg-white p-4 shadow-[0_20px_48px_-24px_rgba(47,63,56,0.28)]"
              >
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 w-full rounded-lg border border-[#e5dfd4] px-3 py-2 text-sm"
                  />
                </label>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
                  To
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 w-full rounded-lg border border-[#e5dfd4] px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setPage(1);
                      setShowDatePicker(false);
                    }}
                    className="flex-1 rounded-full border border-[#e5dfd4] py-2 text-sm font-semibold text-text-primary/70 hover:bg-[#faf9f6]"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 rounded-full bg-[#3e725f] py-2 text-sm font-semibold text-white hover:bg-[#2e5748]"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>

          <label className="relative inline-flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OperationsStatusFilter);
                setPage(1);
              }}
              className="appearance-none rounded-full border border-[#e5dfd4] bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-theme-heading shadow-[0_8px_20px_-14px_rgba(47,63,56,0.2)] outline-none transition hover:border-[#c9bfb0]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-3 h-4 w-4 text-[#7d8f88]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <motion.article
            key={card.label}
            variants={fadeUp}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className={`rounded-[22px] px-6 py-5 shadow-[0_14px_36px_-26px_rgba(47,63,56,0.2)] ${
              card.tone === "mint" ? "bg-[#d8f8ec]" : "bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  card.tone === "mint" ? "text-theme-status-success" : "text-[#b3a99c]"
                }`}
              >
                {card.label}
              </p>
              <span className={card.tone === "mint" ? "text-theme-status-success" : "text-[#7d9a8c]"}>
                <SessionStatIcon icon={card.icon} />
              </span>
            </div>
            <p
              className={`mt-6 font-display text-[38px] font-semibold leading-none tracking-[-0.04em] ${
                card.tone === "mint" ? "text-[#1f5a47]" : "text-theme-heading"
              }`}
            >
              {dashboardQuery.isLoading && !dashboardQuery.data ? (
                <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-[#ece8e0]/90" />
              ) : (
                card.value
              )}
            </p>
          </motion.article>
        ))}
      </motion.div>

      {dashboardQuery.error ? (
        <motion.p variants={fadeUp} className="rounded-[22px] bg-white px-5 py-4 text-sm font-medium text-theme-status-error shadow-soft">
          {dashboardQuery.error.message}
        </motion.p>
      ) : null}

      {actionError ? (
        <motion.p variants={fadeUp} className="rounded-[22px] bg-white px-5 py-4 text-sm font-medium text-theme-status-error shadow-soft">
          {actionError}
        </motion.p>
      ) : null}

      <motion.section
        variants={fadeUp}
        className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_44px_-30px_rgba(47,63,56,0.2)]"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead>
              <tr className="bg-[#f5f2ec] text-left">
                {[
                  "Type",
                  "Patient / User",
                  "Provider",
                  "Date & Time",
                  "Duration",
                  "Status",
                  "Payment",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a48f7a]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboardQuery.isLoading && !dashboardQuery.data ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton columns={8} rows={6} hasAvatarColumn className="border-0 shadow-none" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-text-primary/50">
                    No bookings or sessions match this filter.
                  </td>
                </tr>
              ) : (
                items.map((row, index) => (
                  <OperationsTableRow
                    key={row.id}
                    row={row}
                    index={index}
                    disabled={isMutating}
                    onViewSession={(session) => openSessionDetails(session)}
                    onAcceptBooking={(bookingId) =>
                      bookingMutation.mutate({ bookingId, status: "ACCEPTED" })
                    }
                    onRejectBooking={(bookingId) =>
                      bookingMutation.mutate({ bookingId, status: "REJECTED" })
                    }
                    onCancelBooking={(bookingId) =>
                      bookingMutation.mutate({ bookingId, status: "CANCELLED" })
                    }
                    onStartSession={(sessionId) =>
                      sessionMutation.mutate({ sessionId, status: "ONGOING" })
                    }
                    onCompleteSession={(sessionId) =>
                      sessionMutation.mutate({ sessionId, status: "COMPLETED" })
                    }
                    onCancelSession={(sessionId) =>
                      sessionMutation.mutate({ sessionId, status: "CANCELLED" })
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#f0ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-primary/55">
            Showing {rangeStart}-{rangeEnd} of {total} items
          </p>
          <div className="flex items-center gap-1">
            <PaginationButton
              disabled={page <= 1 || dashboardQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              ‹
            </PaginationButton>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
              }
              return (
                <PaginationButton
                  key={pageNum}
                  active={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </PaginationButton>
              );
            })}
            <PaginationButton
              disabled={page >= totalPages || dashboardQuery.isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              ›
            </PaginationButton>
          </div>
        </div>
      </motion.section>

      <motion.div variants={containerVariants} className="grid gap-5 lg:grid-cols-2">
        <motion.article
          variants={fadeUp}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="flex flex-col rounded-[28px] bg-[#f4f2ed] px-7 py-7 shadow-[0_14px_36px_-26px_rgba(47,63,56,0.16)]"
        >
          <h2 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-[#2c5e4f]">
            Session Satisfaction Index
          </h2>
          <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-text-primary/62">{satisfactionText}</p>
          <motion.div className="mt-auto flex h-32 items-end justify-center gap-2 pt-10">
            {(data?.satisfaction.weeklyBars ?? [12, 28, 45, 32, 58, 40, 52]).map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 8 }}
                animate={{ height: Math.max(16, (height / 100) * 112) }}
                transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: easeOut }}
                className="w-8 max-w-[10%] flex-1 rounded-t-md bg-[#c5ddd2]/90"
              />
            ))}
          </motion.div>
        </motion.article>

        <motion.article
          variants={fadeUp}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="flex flex-col rounded-[28px] bg-[#3f735f] px-7 py-7 text-white shadow-[0_16px_42px_-26px_rgba(63,115,95,0.42)]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z" />
              <path d="m9.2 12.8 1.9 1.9 3.8-4.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="mt-8 font-display text-[28px] font-semibold tracking-[-0.02em]">Credentialing Update</h2>
          <p className="mt-3 max-w-[400px] text-[15px] leading-7 text-white/80">
            {(data?.pendingCredentialingCount ?? 0) === 0
              ? "No providers are pending manual status verification right now."
              : `${data?.pendingCredentialingCount} new provider${(data?.pendingCredentialingCount ?? 0) === 1 ? " is" : "s are"} pending manual status verification.`}{" "}
            Review required for session activation.
          </p>
          <Link
            href="/admin/applications"
            className="mt-auto inline-flex w-fit items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3f735f] transition hover:bg-white/95"
          >
            Review Queue
          </Link>
        </motion.article>
      </motion.div>
    </motion.div>
  );
}

function OperationsTableRow({
  row,
  index,
  disabled,
  onViewSession,
  onAcceptBooking,
  onRejectBooking,
  onCancelBooking,
  onStartSession,
  onCompleteSession,
  onCancelSession,
}: {
  row: AdminOperationsRow;
  index: number;
  disabled: boolean;
  onViewSession: (session: ApiCareSession) => void;
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onStartSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
}) {
  const tone = AVATAR_TONES[index % AVATAR_TONES.length];
  const when = new Date(row.sortAt);

  if (row.kind === "booking") {
    const booking = row.booking;
    const providerLabel =
      booking.type === "LISTENER"
        ? `${booking.provider?.name ?? "Provider"} (Listener)`
        : (booking.provider?.name ?? "Provider");

    return (
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: index * 0.04, ease: easeOut }}
        className="border-t border-[#f4f0ea] transition-colors hover:bg-[#fcfbf8]"
      >
        <td className="px-5 py-4">
          <KindBadge kind="booking" sublabel={toSentenceCase(booking.type)} />
        </td>
        <td className="px-5 py-4">
          <ParticipantCell
            tone={tone}
            name={booking.user?.name}
            email={booking.user?.email}
            userId={booking.userId}
          />
        </td>
        <td className="px-5 py-4">
          <ProviderCell
            name={booking.provider?.name}
            email={booking.provider?.email}
            image={booking.provider?.image}
            label={providerLabel}
          />
        </td>
        <td className="px-5 py-4">
          <DateTimeCell when={when} />
        </td>
        <td className="px-5 py-4 text-sm text-text-primary/70">{booking.duration} min</td>
        <td className="px-5 py-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getBookingStatusClasses(
              booking.status,
            )}`}
          >
            {displayBookingStatus(booking.status)}
          </span>
        </td>
        <td className="px-5 py-4 text-sm font-semibold text-theme-heading">
          {formatCurrency(booking.amount)}
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === "PENDING" ? (
              <>
                <ActionPill
                  label="Approve"
                  tone="primary"
                  disabled={disabled}
                  onClick={() => onAcceptBooking(booking.id)}
                />
                <ActionPill
                  label="Reject"
                  tone="muted"
                  disabled={disabled}
                  onClick={() => onRejectBooking(booking.id)}
                />
              </>
            ) : null}
            {booking.status === "ACCEPTED" ? (
              <ActionPill
                label="Cancel"
                tone="muted"
                disabled={disabled}
                onClick={() => onCancelBooking(booking.id)}
              />
            ) : null}
          </div>
        </td>
      </motion.tr>
    );
  }

  const session = row.session;
  const providerLabel =
    session.sessionMode === "LISTENER"
      ? `${session.provider?.name ?? "Provider"} (Listener)`
      : (session.provider?.name ?? "Provider");

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04, ease: easeOut }}
      className="border-t border-[#f4f0ea] transition-colors hover:bg-[#fcfbf8]"
    >
      <td className="px-5 py-4">
        <KindBadge kind="session" sublabel={toSentenceCase(session.sessionMode)} />
      </td>
      <td className="px-5 py-4">
        <ParticipantCell
          tone={tone}
          name={session.user?.name}
          email={session.user?.email}
          userId={session.userId}
        />
      </td>
      <td className="px-5 py-4">
        <ProviderCell
          name={session.provider?.name}
          email={session.provider?.email}
          image={session.provider?.image}
          label={providerLabel}
        />
      </td>
      <td className="px-5 py-4">
        <DateTimeCell when={when} />
      </td>
      <td className="px-5 py-4 text-sm text-text-primary/70">{session.duration} min</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getSessionStatusClasses(
            session.status,
          )}`}
        >
          {displaySessionStatus(session.status)}
        </span>
      </td>
      <td className="px-5 py-4 text-sm font-semibold text-theme-heading">
        {formatCurrency(session.amount)}
      </td>
      <td className="px-5 py-4">
        <motion.div className="flex flex-wrap items-center gap-2">
          <TableActionButton label="View session" onClick={() => onViewSession(session)} disabled={disabled}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="2.8" />
            </svg>
          </TableActionButton>
          {session.status === "UPCOMING" ? (
            <>
              <ActionPill
                label="Start"
                tone="primary"
                disabled={disabled}
                onClick={() => onStartSession(session.id)}
              />
              <ActionPill
                label="Cancel"
                tone="muted"
                disabled={disabled}
                onClick={() => onCancelSession(session.id)}
              />
            </>
          ) : null}
          {session.status === "ONGOING" ? (
            <ActionPill
              label="Complete"
              tone="primary"
              disabled={disabled}
              onClick={() => onCompleteSession(session.id)}
            />
          ) : null}
          <Link
            href="/admin/finance"
            className="rounded-lg p-2 text-[#9aa8a3] transition hover:bg-[#f0ebe3] hover:text-[#3e725f]"
            aria-label="Billing"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
              <path d="M2.5 10.5h19" />
            </svg>
          </Link>
        </motion.div>
      </td>
    </motion.tr>
  );
}

function KindBadge({ kind, sublabel }: { kind: "booking" | "session"; sublabel: string }) {
  const isBooking = kind === "booking";
  return (
    <motion.div>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
          isBooking ? "bg-[#fff3d6] text-[#8a6a1f]" : "bg-[#dce8f0] text-[#3a5a72]"
        }`}
      >
        {isBooking ? "Booking" : "Session"}
      </span>
      <p className="mt-1 text-xs text-text-primary/45">{sublabel}</p>
    </motion.div>
  );
}

function ParticipantCell({
  tone,
  name,
  email,
  userId,
}: {
  tone: string;
  name?: string | null;
  email?: string | null;
  userId: string;
}) {
  return (
    <motion.div className="flex items-center gap-3">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
      >
        {getInitials(name, email)}
      </span>
      <div>
        <p className="font-semibold text-theme-heading">{name ?? "Member"}</p>
        <p className="text-xs text-text-primary/45">Client ID: {clientIdLabel(userId)}</p>
      </div>
    </motion.div>
  );
}

function ProviderCell({
  name,
  email,
  image,
  label,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  label: string;
}) {
  return (
    <motion.div className="flex items-center gap-2.5">
      <UserAvatarCircle
        name={name}
        email={email}
        image={image}
        className="h-9 w-9"
        fallbackClassName="bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-xs"
      />
      <span className="text-sm font-medium text-theme-heading">{label}</span>
    </motion.div>
  );
}

function DateTimeCell({ when }: { when: Date }) {
  return (
    <motion.div>
      <p className="text-sm font-medium text-theme-heading">{tableDateFormatter.format(when)}</p>
      <p className="mt-0.5 text-xs text-text-primary/45">{tableTimeFormatter.format(when)}</p>
    </motion.div>
  );
}

function ActionPill({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: "primary" | "muted";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "primary"
          ? "bg-[#3e725f] text-white hover:bg-[#356652]"
          : "border border-[#e5dfd4] bg-white text-theme-heading hover:border-[#c9bfb0]"
      }`}
    >
      {label}
    </button>
  );
}

function TableActionButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-lg p-2 text-[#9aa8a3] transition hover:bg-[#f0ebe3] hover:text-[#3e725f] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`grid h-9 min-w-9 place-items-center rounded-lg text-sm font-semibold transition ${
        active
          ? "bg-[#3e725f] text-white"
          : "text-text-primary/55 hover:bg-[#f0ebe3] disabled:cursor-not-allowed disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}
