"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { ActivityFeedSkeleton, StatCardsSkeleton } from "@/components/skeletons";
import { formatDateTime, toSentenceCase } from "@/lib/display";
import type { ApiAuditLogEntry, ApiAuditLogListResponse, AuditActionValue } from "@/types/api";
import { auditActionCategory, type AuditCategory } from "@/lib/audit-display";

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

function actionToCategory(action: AuditActionValue): AuditCategory {
  return auditActionCategory(action);
}

function categoryAvatarFallback(category: AuditCategory): string {
  switch (category) {
    case "users":
      return "bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-[#2f745f] text-xs";
    case "applications":
      return "bg-linear-to-br from-[#e8ded1] to-[#d4c0a8] text-[#6e5542] text-xs";
    case "bookings":
      return "bg-linear-to-br from-[#edf4ff] to-[#cfdcf0] text-[#4a6282] text-xs";
    case "sessions":
      return "bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-xs";
    case "payouts":
      return "bg-linear-to-br from-[#f3efe9] to-[#e0d8cc] text-[#7a6a58] text-xs";
    default:
      return "bg-text-secondary text-xs text-white";
  }
}

function AuditTimelineFallbackIcon({ category }: { category: AuditCategory }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${categoryAvatarFallback(category)}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-80" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 2v4M16 2v4M4 9h16v11H4z" strokeLinecap="round" />
        <path d="M4 13h16" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function formatDetails(details: ApiAuditLogEntry["details"]): string {
  if (!details || Object.keys(details).length === 0) {
    return "No additional details recorded.";
  }
  return JSON.stringify(details, null, 2);
}

export function AdminAuditPage() {
  const [categoryFilter, setCategoryFilter] = useState<"all" | AuditCategory>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const auditQuery = useQuery({
    queryKey: ["admin-audit", categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ take: "80" });
      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }
      return apiFetch<ApiAuditLogListResponse>(`/api/admin/audit?${params.toString()}`);
    },
  });

  const entries = useMemo(() => auditQuery.data?.items ?? [], [auditQuery.data?.items]);

  const stats = useMemo(() => {
    const byCategory = (cat: AuditCategory) =>
      entries.filter((e) => actionToCategory(e.action) === cat).length;

    return [
      {
        label: "Tracked Events",
        value: String(entries.length),
        meta: categoryFilter === "all" ? "All categories" : `Filtered: ${categoryFilter}`,
      },
      {
        label: "Admin Actions",
        value: String(byCategory("users")),
        meta: "Profile & role updates",
      },
      {
        label: "Application Reviews",
        value: String(byCategory("applications")),
        meta: "Approve / reject decisions",
      },
      {
        label: "Financial Events",
        value: String(byCategory("payouts")),
        meta: "Wallet & ledger activity",
      },
    ];
  }, [categoryFilter, entries]);

  if (auditQuery.isLoading) {
    return (
      <div className="space-y-9 pb-6">
        <StatCardsSkeleton count={4} />
        <ActivityFeedSkeleton />
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
            Audit Log
          </h1>
          <p className="mt-2 max-w-[760px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Persistent accountability trail with actor, action, and sanitized change details only.
          </p>
        </motion.div>

        {auditQuery.error ? (
          <div className="mt-6 rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-[#cf4f45] shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]">
            {auditQuery.error.message}
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

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
        className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)] md:p-7"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.h2
              variants={fadeBlock}
              className="font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]"
            >
              Platform Timeline
            </motion.h2>
            <p className="mt-1 text-sm text-text-primary/55">
              Sorted by most recent recorded actions
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["users", "Users"],
                ["applications", "Applications"],
                ["bookings", "Bookings"],
                ["sessions", "Sessions"],
                ["payouts", "Payouts"],
              ] as const
            ).map(([value, label]) => {
              const active = categoryFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#2f6f5b] text-white"
                      : "bg-[#f3efe9] text-text-primary/70 hover:bg-[#e9e3da]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {entries.length > 0 ? (
            entries.map((entry) => {
              const category = actionToCategory(entry.action);
              const expanded = expandedId === entry.id;

              return (
                <motion.article
                  key={entry.id}
                  variants={fadeBlock}
                  whileHover={{ x: 4, y: -2 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  className="rounded-[22px] bg-[#fbfaf7] px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <AuditTimelineFallbackIcon category={category} />
                      <div className="min-w-0">
                        <p className="text-[20px] font-semibold leading-6 text-[#243230]">
                          {entry.summary}
                        </p>
                        <p className="mt-2 text-sm text-text-primary/58">
                          {entry.actorEmail
                            ? `By ${entry.actorEmail}`
                            : "System action"}{" "}
                          · {toSentenceCase(entry.targetType)} {entry.targetId.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#f3efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d896f]">
                      {toSentenceCase(entry.action.replaceAll("_", " "))}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/30">
                    <span>{toSentenceCase(category)}</span>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="mt-3 text-xs font-semibold text-[#2f6f5b] hover:underline"
                  >
                    {expanded ? "Hide details" : "View sanitized details"}
                  </button>

                  {expanded ? (
                    <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-[#f3efe9] p-3 text-left text-[11px] leading-relaxed text-[#4a4a4a]">
                      {formatDetails(entry.details)}
                    </pre>
                  ) : null}
                </motion.article>
              );
            })
          ) : (
            <div className="rounded-[22px] bg-[#fbfaf7] px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
              No audit events matched the selected category. New admin and platform actions will appear here.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
