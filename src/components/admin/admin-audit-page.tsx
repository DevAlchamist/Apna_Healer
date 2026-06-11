"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { formatAuditTimestamp } from "@/lib/display";
import type { ApiAuditLogEntry, ApiAuditLogListResponse, AuditActionValue } from "@/types/api";
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_DATE_RANGE_OPTIONS,
  AUDIT_ROLE_OPTIONS,
  auditActorDisplayName,
  auditActorInitials,
  auditActorRoleLabel,
  auditEntityTone,
} from "@/lib/audit-display";
import { TableSkeleton } from "@/components/skeletons";

const PAGE_SIZE = 10;

function EntityBadge({ targetType, label }: { targetType: string; label: string }) {
  const tone = auditEntityTone(targetType);
  const classes =
    tone === "user"
      ? "bg-[#f3efe9] text-[#7a6a58]"
      : tone === "session"
        ? "bg-[#e3f0eb] text-theme-status-success"
        : tone === "setting"
          ? "bg-[#eef0f0] text-[#5c6664]"
          : "bg-[#f3efe9] text-[#7a6a58]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: "success" | "failed" }) {
  const isSuccess = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold ${
        isSuccess ? "text-theme-status-success" : "text-theme-status-error"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isSuccess ? "bg-theme-button-primary" : "bg-[#cf4f45]"}`}
        aria-hidden
      />
      {isSuccess ? "Success" : "Failed"}
    </span>
  );
}

function exportAuditCsv(items: ApiAuditLogEntry[]) {
  const header = ["Timestamp", "Actor", "Role", "Action", "Entity", "IP Address", "Status"];
  const rows = items.map((row) => [
    formatAuditTimestamp(row.createdAt),
    auditActorDisplayName(row),
    auditActorRoleLabel(row),
    row.summary,
    row.entityLabel,
    row.ipAddress,
    row.status === "success" ? "Success" : "Failed",
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `apna-healer-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState<AuditActionValue | "">("");
  const [roleFilter, setRoleFilter] = useState<(typeof AUDIT_ROLE_OPTIONS)[number]["value"]>("");
  const [daysFilter, setDaysFilter] = useState("30");
  const [page, setPage] = useState(1);

  const auditQuery = useQuery({
    queryKey: ["admin-audit", actionFilter, roleFilter, daysFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        take: String(PAGE_SIZE),
        page: String(page),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (roleFilter) params.set("role", roleFilter);
      if (daysFilter) params.set("days", daysFilter);
      return apiFetch<ApiAuditLogListResponse>(`/api/admin/audit?${params.toString()}`);
    },
  });

  const entries = auditQuery.data?.items ?? [];
  const meta = auditQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  function resetFilters() {
    setActionFilter("");
    setRoleFilter("");
    setDaysFilter("30");
    setPage(1);
  }

  async function handleExport() {
    if (entries.length === 0) return;

    const params = new URLSearchParams({ take: "500", page: "1" });
    if (actionFilter) params.set("action", actionFilter);
    if (roleFilter) params.set("role", roleFilter);
    if (daysFilter) params.set("days", daysFilter);

    try {
      const data = await apiFetch<ApiAuditLogListResponse>(`/api/admin/audit?${params.toString()}`);
      exportAuditCsv(data.items);
    } catch {
      exportAuditCsv(entries);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] font-semibold tracking-[-0.03em] text-theme-heading md:text-[48px]">
            Platform Audit Logs
          </h1>
          <p className="mt-2 max-w-[720px] text-[15px] leading-7 text-text-primary/60">
            A comprehensive ledger of system events, maintaining absolute transparency and
            accountability across the ApnaHealer ecosystem.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-theme-button-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(47,111,91,0.55)] transition-colors hover:bg-[#285f4e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3v12M7 10l5 5 5-5M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export CSV
        </button>
      </header>

      {auditQuery.error ? (
        <div className="rounded-[20px] border border-[#f0d8d5] bg-[#fff8f7] px-5 py-4 text-sm font-medium text-theme-status-error">
          {auditQuery.error.message}
        </div>
      ) : null}

      <section className="rounded-[24px] border border-theme-muted bg-[#fbfaf7] p-4 md:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-[160px] flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d9287]">
              Action Type
            </span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as AuditActionValue | "");
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#e5dfd6] bg-white px-3 py-2.5 text-sm font-medium text-theme-heading outline-none focus:border-[#2f6f5b]"
            >
              {AUDIT_ACTION_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[140px] flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d9287]">
              Role
            </span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as (typeof AUDIT_ROLE_OPTIONS)[number]["value"]);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#e5dfd6] bg-white px-3 py-2.5 text-sm font-medium text-theme-heading outline-none focus:border-[#2f6f5b]"
            >
              {AUDIT_ROLE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[160px] flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d9287]">
              Date Range
            </span>
            <div className="relative">
              <select
                value={daysFilter}
                onChange={(e) => {
                  setDaysFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-[#e5dfd6] bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-theme-heading outline-none focus:border-[#2f6f5b]"
              >
                {AUDIT_DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d9287]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e5dfd6] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c6664] transition-colors hover:bg-[#f3efe9]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 19A9 9 0 0 0 19 5" strokeLinecap="round" />
            </svg>
            Reset Filters
          </button>
        </div>
      </section>

      {auditQuery.isLoading ? (
        <TableSkeleton columns={6} rows={PAGE_SIZE} hasAvatarColumn />
      ) : (
        <section className="overflow-hidden rounded-[24px] border border-theme-muted bg-white shadow-[0_18px_50px_-34px_rgba(47,63,56,0.14)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-theme-muted bg-[#fbfaf7]">
                  {["Timestamp", "Actor", "Action", "Entity", "IP Address", "Status"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d9287]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[#f4f0ea] transition-colors last:border-0 hover:bg-[#fbfaf7]/60"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#5c6664]">
                        {formatAuditTimestamp(entry.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {entry.actorId ? (
                            <UserAvatarCircle
                              name={entry.actorName}
                              email={entry.actorEmail}
                              image={entry.actorImage}
                              className="h-9 w-9 shrink-0"
                              fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-theme-status-success text-xs font-semibold"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef0f0] text-xs font-semibold text-[#5c6664]">
                              {auditActorInitials(entry)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-theme-heading">
                              {auditActorDisplayName(entry)}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#9d9287]">
                              {auditActorRoleLabel(entry)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[240px] px-5 py-4 text-sm font-medium text-theme-heading">
                        {entry.summary}
                      </td>
                      <td className="px-5 py-4">
                        <EntityBadge targetType={entry.targetType} label={entry.entityLabel} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#5c6664]">
                        {entry.ipAddress}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-text-primary/55">
                      No audit events matched your filters. Platform actions will appear here as they
                      occur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-theme-muted px-5 py-4">
            <p className="text-sm text-[#5c6664]">
              {total > 0
                ? `Showing ${rangeStart}-${rangeEnd} of ${total.toLocaleString()} entries`
                : "No entries to display"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-[#5c6664] transition-colors hover:bg-[#f3efe9] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    num === page
                      ? "bg-theme-button-primary text-white"
                      : "text-[#5c6664] hover:bg-[#f3efe9]"
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-[#5c6664] transition-colors hover:bg-[#f3efe9] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      <footer className="flex flex-col items-center px-4 py-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e3f0eb] text-theme-status-success">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 3 4 7v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-theme-heading">Compliance &amp; Data Integrity</h2>
        <p className="mt-2 max-w-[520px] text-sm leading-6 text-text-primary/55">
          Logs are stored in an immutable, cryptographically sealed ledger. Any attempt to modify
          these records will trigger an immediate high-priority system alert.
        </p>
      </footer>
    </div>
  );
}
