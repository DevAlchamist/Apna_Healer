"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { applicationDataPrimaryLine, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiApplication, ProfessionalApplicationStatusValue } from "@/types/api";
import { ApplicationListSkeleton } from "@/components/skeletons";

const viewport = { once: true, amount: 0.18 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

function ApplicationIcon({ type }: { type: ApiApplication["type"] }) {
  if (type === "LISTENER") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="8" cy="9" r="3.2" />
        <path d="M3.5 18a4.5 4.5 0 0 1 9 0" strokeLinecap="round" />
        <path d="M16 8h4M16 12h4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 5h10v14H7z" />
      <path d="M9.5 9.5h5M9.5 13.5h5M9.5 17.5H13" strokeLinecap="round" />
      <path d="M9 3.5h6" strokeLinecap="round" />
    </svg>
  );
}

function getStatusBadgeClass(status: ProfessionalApplicationStatusValue) {
  if (status === "APPROVED") {
    return "bg-[#dff4e7] text-theme-status-success";
  }
  if (status === "REJECTED") {
    return "bg-[#fde2df] text-theme-status-error";
  }
  return "bg-[#f3efe9] text-[#9d896f]";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function formatDataValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  if (isRecord(value)) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function applicationDataEntries(data: unknown) {
  if (!isRecord(data)) return [];
  return Object.entries(data).filter(([key]) => key !== "migratedFromLegacyApplications");
}

export function AdminApplicationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProfessionalApplicationStatusValue>("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/admin/applications?take=120"),
  });

  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const filtered = useMemo(
    () => applications.filter((application) => application.status === tab),
    [applications, tab],
  );

  const resolvedSelectedId =
    selectedId && filtered.some((application) => application.id === selectedId)
      ? selectedId
      : filtered[0]?.id ?? null;

  const selectedApplication = useMemo(
    () => filtered.find((application) => application.id === resolvedSelectedId) ?? null,
    [filtered, resolvedSelectedId],
  );

  const pipelineStats = useMemo(
    () => [
      {
        label: "Pending",
        value: String(applications.filter((a) => a.status === "PENDING").length),
        meta: "Awaiting admin decision",
      },
      {
        label: "Approved",
        value: String(applications.filter((a) => a.status === "APPROVED").length),
        meta: "Provider access granted",
      },
      {
        label: "Rejected",
        value: String(applications.filter((a) => a.status === "REJECTED").length),
        meta: "Closed applications",
      },
    ],
    [applications],
  );

  const reviewMutation = useMutation({
    mutationFn: (body: {
      applicationId: string;
      status?: "APPROVED" | "REJECTED";
      adminNote?: string;
    }) =>
      apiMutation(`/api/admin/applications/${body.applicationId}`, "PATCH", {
        ...(body.status ? { status: body.status } : {}),
        ...(body.adminNote !== undefined ? { adminNote: body.adminNote } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const dataEntries = applicationDataEntries(selectedApplication?.applicationData ?? null);

  useEffect(() => {
    queueMicrotask(() => {
      setAdminNoteDraft(selectedApplication?.adminNote ?? "");
    });
  }, [selectedApplication?.id, selectedApplication?.adminNote]);

  return (
    <div className="space-y-7 pb-6">
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={containerVariants}
        className="space-y-7"
      >
        <motion.div variants={fadeUp}>
          <h1 className="font-display text-[40px] font-semibold tracking-[-0.04em] text-theme-heading md:text-[52px]">
            Application <span className="font-medium italic text-[#3b7763]">Pipeline</span>
          </h1>
          <p className="mt-2 max-w-[780px] text-[15px] leading-7 text-text-primary/60 md:text-base">
            Review structured listener and therapist applications. Approving updates the member role and provisions
            their professional profile.
          </p>
        </motion.div>

        {applicationsQuery.error ? (
          <div className="rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-[0_16px_38px_-30px_rgba(47,63,56,0.2)]">
            {applicationsQuery.error.message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setSelectedId(null);
              }}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                tab === value
                  ? "bg-[#3e725f] text-white shadow-[0_12px_24px_-16px_rgba(62,114,95,0.8)]"
                  : "bg-[#f1ede7] text-text-primary/65 hover:bg-[#e8e1d8]"
              }`}
            >
              {toSentenceCase(value)}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr] xl:items-start">
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-theme-heading">Queue</h2>
              <span className="rounded-full bg-[#dff4e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-status-success">
                {filtered.length} in tab
              </span>
            </div>

            <div className="space-y-4 max-h-[min(52vh,22rem)] overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch] md:max-h-[min(56vh,28rem)] xl:max-h-[min(72vh,calc(100dvh-18rem))]">
              {applicationsQuery.isLoading ? <ApplicationListSkeleton count={4} /> : null}

              {filtered.length === 0 && !applicationsQuery.isLoading ? (
                <div className="rounded-[26px] bg-white p-5 text-sm text-text-primary/58 shadow-[0_16px_38px_-30px_rgba(47,63,56,0.2)]">
                  No applications in this tab.
                </div>
              ) : null}

              {filtered.map((application, index) => {
                const isActive = selectedApplication?.id === application.id;
                return (
                  <motion.button
                    key={application.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(application.id);
                      setAdminNoteDraft(application.adminNote ?? "");
                    }}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.06 + index * 0.05, ease: easeOut }}
                    whileHover={{ x: 4, y: -2 }}
                    className={`w-full rounded-[26px] border bg-white p-5 text-left shadow-[0_16px_38px_-30px_rgba(47,63,56,0.2)] transition ${
                      isActive
                        ? "border-[#3e725f] ring-1 ring-[#3e725f]/10"
                        : "border-transparent hover:border-[#ebe5dd]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf8f2] text-[#55756a]">
                        <ApplicationIcon type={application.type} />
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(
                          application.status,
                        )}`}
                      >
                        {toSentenceCase(application.status)}
                      </span>
                    </div>

                    <div className="mt-6">
                      <p className="text-[26px] font-semibold leading-7 tracking-[-0.03em] text-theme-heading">
                        {application.user?.name ?? "Unnamed applicant"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-text-primary/55">
                        {applicationDataPrimaryLine(application.applicationData) || "Structured application payload"}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-xs text-text-primary/45">
                      <UserAvatarCircle
                        name={application.user?.name}
                        email={application.user?.email}
                        image={application.user?.image}
                        className="h-6 w-6 shrink-0"
                        fallbackClassName="bg-linear-to-br from-[#d8e1e4] to-[#b8c7cd] text-[#3c5e63] text-[10px] leading-none"
                      />
                      Submitted {formatShortDate(application.createdAt)}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="min-w-0">
            {selectedApplication ? (
              <AnimatePresence mode="wait">
                <motion.article
                  key={selectedApplication.id}
                  initial={{ opacity: 0, x: 26, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -14, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: easeOut }}
                  className="rounded-[34px] bg-white p-7 shadow-[0_20px_54px_-34px_rgba(47,63,56,0.24)] md:p-8"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <UserAvatarCircle
                        name={selectedApplication.user?.name}
                        email={selectedApplication.user?.email}
                        image={selectedApplication.user?.image}
                        className="h-24 w-24 shrink-0"
                        roundedClassName="rounded-[26px]"
                        fallbackClassName="bg-linear-to-br from-[#203842] to-[#647f88] text-white"
                        initialsClassName="text-2xl"
                      />

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8f88]">
                          {toSentenceCase(selectedApplication.type)} application
                        </p>
                        <h2 className="mt-2 font-display text-[44px] font-semibold tracking-[-0.04em] text-theme-heading">
                          {selectedApplication.user?.name ?? "Unnamed applicant"}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-primary/55">
                          <span className="inline-flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                              <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
                              <path d="m6 8 6 5 6-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {selectedApplication.user?.email}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                              <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z" />
                            </svg>
                            Current role: {toSentenceCase(selectedApplication.user?.role ?? "USER")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(
                          selectedApplication.status,
                        )}`}
                      >
                        {toSentenceCase(selectedApplication.status)}
                      </span>
                    </div>
                  </div>

                  <div className="my-7 h-px bg-[#ece7df]" />

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div>
                      <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#26463d]">Applicant summary</h3>
                      <p className="mt-3 text-[15px] leading-7 text-text-primary/65">
                        {applicationDataPrimaryLine(selectedApplication.applicationData) ||
                          "No primary narrative field detected."}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[16px] bg-[#f3f1ec] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e8477]">Submitted</p>
                          <p className="mt-1 text-sm text-text-primary/70">{formatShortDate(selectedApplication.createdAt)}</p>
                        </div>
                        <div className="rounded-[16px] bg-[#f3f1ec] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e8477]">Reviewed</p>
                          <p className="mt-1 text-sm text-text-primary/70">{formatShortDate(selectedApplication.reviewedAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#26463d]">Admin note</h3>
                      <textarea
                        value={adminNoteDraft}
                        onChange={(e) => setAdminNoteDraft(e.target.value)}
                        rows={5}
                        className="mt-3 w-full rounded-[18px] border border-[#ebe5dd] bg-theme-surface-muted px-4 py-3 text-sm text-text-primary/80"
                        placeholder="Internal context for the decision log…"
                      />
                    </div>
                  </div>

                  <div className="my-7 h-px bg-[#ece7df]" />

                  <div>
                    <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#26463d]">Application payload</h3>
                    {dataEntries.length === 0 ? (
                      <p className="mt-4 text-sm text-text-primary/55">No structured fields were stored for this record.</p>
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {dataEntries.map(([key, value]) => (
                          <div key={key} className="rounded-[18px] border border-[#ebe5dd] bg-theme-surface-muted px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e8477]">
                              {toSentenceCase(key)}
                            </p>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-text-primary/70">
                              {formatDataValue(value)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedApplication.status === "PENDING" ? (
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <motion.button
                        type="button"
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({
                            applicationId: selectedApplication.id,
                            status: "APPROVED",
                            adminNote: adminNoteDraft.trim() || undefined,
                          })
                        }
                        className="rounded-full bg-[#3e725f] px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(62,114,95,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reviewMutation.isPending ? "Saving…" : "Approve"}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({
                            applicationId: selectedApplication.id,
                            status: "REJECTED",
                            adminNote: adminNoteDraft.trim() || undefined,
                          })
                        }
                        className="rounded-full bg-[#fde2df] px-8 py-4 text-sm font-semibold text-theme-status-error disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </motion.button>
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={reviewMutation.isPending || !adminNoteDraft.trim()}
                      onClick={() =>
                        reviewMutation.mutate({
                          applicationId: selectedApplication.id,
                          adminNote: adminNoteDraft.trim(),
                        })
                      }
                      className="rounded-full border border-[#dcd4c8] px-6 py-3 text-sm font-semibold text-text-primary/80 disabled:opacity-40"
                    >
                      Save admin note
                    </button>
                  </div>

                  {reviewMutation.error ? (
                    <p className="mt-4 text-sm font-medium text-theme-status-error">{reviewMutation.error.message}</p>
                  ) : null}
                </motion.article>
              </AnimatePresence>
            ) : (
              <div className="rounded-[34px] bg-white p-7 text-sm text-text-primary/58 shadow-[0_20px_54px_-34px_rgba(47,63,56,0.24)] md:p-8">
                Select an application to inspect its payload.
              </div>
            )}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={containerVariants}
        className="grid gap-5 md:grid-cols-3"
      >
        {pipelineStats.map((stat) => (
          <motion.article
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="rounded-[28px] bg-white px-7 py-6 shadow-[0_16px_42px_-30px_rgba(47,63,56,0.18)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a48f7a]">{stat.label}</p>
            <p className="mt-3 font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-theme-heading">
              {stat.value}
            </p>
            <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
          </motion.article>
        ))}
      </motion.section>
    </div>
  );
}
