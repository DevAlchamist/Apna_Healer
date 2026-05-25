"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";
import { ContentGridSkeleton, StatCardsSkeleton } from "@/components/skeletons";
import { applicationDataPrimaryLine, formatCurrency, formatDateTime } from "@/lib/display";
import type {
  ApiApplication,
  ApiBooking,
  ApiCareSession,
  ApiProvider,
  ApiTransaction,
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

type ExportRow = Record<string, string | number | boolean | null | undefined>;

function escapeCsvValue(value: ExportRow[string]) {
  const stringValue = value == null ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(rows: ExportRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return lines.join("\n");
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminExportsPage() {
  const usersQuery = useQuery({
    queryKey: ["admin-exports-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });
  const providersQuery = useQuery({
    queryKey: ["admin-exports-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=100"),
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-exports-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/applications?take=100"),
  });
  const bookingsQuery = useQuery({
    queryKey: ["admin-exports-bookings"],
    queryFn: () => apiFetch<ApiBooking[]>("/api/bookings?scope=all&take=100"),
  });
  const sessionsQuery = useQuery({
    queryKey: ["admin-exports-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?scope=all&take=100"),
  });
  const payoutsQuery = useQuery({
    queryKey: ["admin-exports-payouts"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/admin/payouts?take=100"),
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const payouts = useMemo(() => payoutsQuery.data ?? [], [payoutsQuery.data]);

  const datasets = useMemo(
    () => [
      {
        label: "Users",
        description: "Identity, verification, role, and wallet snapshot for loaded platform users.",
        fileStem: "users",
        recordCount: users.length,
        rows: users.map((user) => ({
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          availableBalance: user.wallet?.availableBalance ?? "",
          heldBalance: user.wallet?.heldBalance ?? "",
        })),
      },
      {
        label: "Providers",
        description: "Verified therapist and listener directory with rates, availability, and delivery volume.",
        fileStem: "providers",
        recordCount: providers.length,
        rows: providers.map((provider) => ({
          id: provider.id,
          name: provider.name ?? "",
          role: provider.role,
          isVerified: provider.isVerified,
          hourlyRate: provider.hourlyRate ?? "",
          sessionCount: provider.sessionCount,
          nextAvailabilityDate: provider.nextAvailabilityDate ?? "",
          specializations: provider.specializations.join(" | "),
          languages: provider.languages.join(" | "),
        })),
      },
      {
        label: "Applications",
        description: "Provider unlock workflow records across therapist and listener applications.",
        fileStem: "applications",
        recordCount: applications.length,
        rows: applications.map((application) => ({
          id: application.id,
          applicantName: application.user?.name ?? "",
          applicantEmail: application.user?.email ?? "",
          type: application.type,
          status: application.status,
          preview: applicationDataPrimaryLine(application.applicationData),
          adminNote: application.adminNote ?? "",
          createdAt: application.createdAt,
          reviewedAt: application.reviewedAt ?? "",
        })),
      },
      {
        label: "Bookings",
        description: "Request-phase consultation records before and after provider decisions.",
        fileStem: "bookings",
        recordCount: bookings.length,
        rows: bookings.map((booking) => ({
          id: booking.id,
          participant: booking.user?.name ?? "",
          provider: booking.provider?.name ?? "",
          type: booking.type,
          status: booking.status,
          requestedDate: booking.requestedDate,
          duration: booking.duration,
          amount: booking.amount,
          updatedAt: booking.updatedAt,
        })),
      },
      {
        label: "Sessions",
        description: "Confirmed care sessions with lifecycle state, timing, and revenue values.",
        fileStem: "sessions",
        recordCount: sessions.length,
        rows: sessions.map((session) => ({
          id: session.id,
          participant: session.user?.name ?? "",
          provider: session.provider?.name ?? "",
          sessionMode: session.sessionMode,
          status: session.status,
          startTime: session.startTime,
          duration: session.duration,
          amount: session.amount,
          meetingLink: session.meetingLink ?? "",
        })),
      },
      {
        label: "Payouts",
        description: "Successful payout ledger rows generated by completed provider settlements.",
        fileStem: "payouts",
        recordCount: payouts.length,
        rows: payouts.map((payout) => ({
          id: payout.id,
          beneficiary: payout.user?.name ?? "",
          amount: payout.amount,
          purpose: payout.purpose,
          createdAt: payout.createdAt,
          referenceId: payout.referenceId ?? "",
        })),
      },
    ],
    [applications, bookings, payouts, providers, sessions, users],
  );

  const stats = useMemo(
    () => [
      {
        label: "Datasets Ready",
        value: String(datasets.length),
        meta: "Client-side JSON and CSV export actions",
      },
      {
        label: "Loaded Records",
        value: String(datasets.reduce((sum, dataset) => sum + dataset.recordCount, 0)),
        meta: "Based on current admin API windows",
      },
      {
        label: "Payout Volume",
        value: formatCurrency(payouts.reduce((sum, payout) => sum + Number(payout.amount), 0)),
        meta: `${payouts.length} payout rows`,
      },
      {
        label: "Latest Session Event",
        value: sessions[0] ? formatDateTime(sessions[0].startTime) : "None",
        meta: "Most recent loaded care session",
      },
    ],
    [datasets, payouts, sessions],
  );

  const queryError =
    usersQuery.error?.message ??
    providersQuery.error?.message ??
    applicationsQuery.error?.message ??
    bookingsQuery.error?.message ??
    sessionsQuery.error?.message ??
    payoutsQuery.error?.message;

  const isPageLoading =
    usersQuery.isLoading ||
    providersQuery.isLoading ||
    applicationsQuery.isLoading ||
    bookingsQuery.isLoading ||
    sessionsQuery.isLoading ||
    payoutsQuery.isLoading;

  if (isPageLoading) {
    return (
      <div className="space-y-9 pb-6">
        <StatCardsSkeleton count={4} />
        <ContentGridSkeleton count={6} columns={3} />
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
            Export Center
          </h1>
          <p className="mt-2 max-w-[780px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live export workspace for the datasets currently available through the admin APIs.
            Downloads reflect the loaded API windows on this page rather than a full database dump.
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

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
        className="grid gap-5 xl:grid-cols-2"
      >
        {datasets.map((dataset) => (
          <motion.article
            key={dataset.label}
            variants={fadeBlock}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b1a89d]">
                  Dataset
                </p>
                <h2 className="mt-2 font-display text-[34px] font-semibold tracking-[-0.03em] text-[#243230]">
                  {dataset.label}
                </h2>
              </div>
              <div className="rounded-full bg-[#f3efe9] px-4 py-2 text-sm font-semibold text-[#2f6f5b]">
                {dataset.recordCount} rows
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-text-primary/60">{dataset.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadText(
                    `${dataset.fileStem}.json`,
                    JSON.stringify(dataset.rows, null, 2),
                    "application/json;charset=utf-8",
                  )
                }
                className="rounded-full bg-[#2f6f5b] px-5 py-3 text-sm font-semibold text-white"
              >
                Download JSON
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadText(
                    `${dataset.fileStem}.csv`,
                    toCsv(dataset.rows),
                    "text/csv;charset=utf-8",
                  )
                }
                className="rounded-full bg-[#f3efe9] px-5 py-3 text-sm font-semibold text-text-primary/75"
              >
                Download CSV
              </button>
            </div>
          </motion.article>
        ))}
      </motion.section>
    </div>
  );
}
