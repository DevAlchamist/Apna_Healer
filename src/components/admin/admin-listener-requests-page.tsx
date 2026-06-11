"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AdminListenerAssignModal } from "@/components/admin/admin-listener-assign-modal";
import { AdminListenerRequestEditModal } from "@/components/admin/admin-listener-request-edit-modal";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { useSessionDetailsModal } from "@/components/dashboard/session-details-modal";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatDateTime, formatShortDate } from "@/lib/display";
import type { ApiCareSession, ApiUser } from "@/types/api";
import { ListenerRequestCardSkeleton } from "@/components/skeletons";

type AdminListenerRequest = {
  id: string;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  emotionalTags: string[];
  preferredTone: string | null;
  preferredLanguage: string | null;
  note: string | null;
  status: "PENDING" | "ASSIGNED" | "APPROVED" | "DECLINED" | "EXPIRED";
  listenerConfirmation: "PENDING" | "ACCEPTED" | "DECLINED";
  assignedListenerId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  assignedListener:
    | { id: string; name: string | null; email: string; image: string | null; role: string }
    | null;
  session: { id: string; status: string; startTime?: string } | null;
};

type TabKey = "PENDING" | "ASSIGNED" | "APPROVED";

const TAB_LABELS: Record<TabKey, string> = {
  PENDING: "Unassigned",
  ASSIGNED: "Assigned",
  APPROVED: "Confirmed",
};

type AdminListenerRequestMutationInput =
  | { id: string; action: "assign"; listenerId: string }
  | { id: string; action: "decline" }
  | {
      id: string;
      action: "approve";
      approve: { meetingLink?: string; notes?: string; description?: string };
    }
  | {
      id: string;
      action: "update";
      update: {
        preferredDate?: string;
        preferredTime?: string;
        duration?: number;
        emotionalTags?: string[];
        preferredTone?: string | null;
        preferredLanguage?: string | null;
        note?: string | null;
      };
    };

function timeLabel(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function preferredWhenLabel(dateIso: string, time: string): string {
  const d = new Date(dateIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return `Today, ${timeLabel(time)}`;
  if (diff === 1) return `Tomorrow, ${timeLabel(time)}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}, ${timeLabel(time)}`;
}

function memberSubtitle(row: AdminListenerRequest): string {
  const created = new Date(row.createdAt);
  const days = Math.max(
    0,
    Math.floor((Date.now() - created.getTime()) / (24 * 60 * 60 * 1000)),
  );
  if (days < 7) return "New member · 1st request";
  if (row.status === "APPROVED") return "Returning member · confirmed";
  return `Member · requested ${formatShortDate(created)}`;
}

export function AdminListenerRequestsPage() {
  const { open: openSessionDetails } = useSessionDetailsModal();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [sortNewest, setSortNewest] = useState(true);
  const [assignRequestId, setAssignRequestId] = useState<string | null>(null);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [approveModalRowId, setApproveModalRowId] = useState<string | null>(null);
  const [approveMeetingLink, setApproveMeetingLink] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approveDescription, setApproveDescription] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const allQuery = useQuery({
    queryKey: ["admin-listener-requests", "all"],
    queryFn: () => apiFetch<AdminListenerRequest[]>("/api/admin/listener-requests"),
  });

  const listenersQuery = useQuery({
    queryKey: ["admin-listeners"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?role=LISTENER"),
  });

  const listeners = useMemo(
    () => (listenersQuery.data ?? []).filter((u) => u.role === "LISTENER"),
    [listenersQuery.data],
  );

  const counts = useMemo(() => {
    const all = allQuery.data ?? [];
    return {
      PENDING: all.filter((r) => r.status === "PENDING").length,
      ASSIGNED: all.filter((r) => r.status === "ASSIGNED").length,
      APPROVED: all.filter((r) => r.status === "APPROVED").length,
    };
  }, [allQuery.data]);

  const rows = useMemo(() => {
    const filtered = (allQuery.data ?? []).filter((r) => r.status === tab);
    return [...filtered].sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortNewest ? bt - at : at - bt;
    });
  }, [allQuery.data, tab, sortNewest]);

  const assignRequest = useMemo(
    () =>
      assignRequestId
        ? (allQuery.data ?? []).find((r) => r.id === assignRequestId) ?? null
        : null,
    [assignRequestId, allQuery.data],
  );

  const editRequest = useMemo(() => {
    if (!editRequestId) return null;
    return (allQuery.data ?? []).find((r) => r.id === editRequestId) ?? null;
  }, [editRequestId, allQuery.data]);

  const approveModalRow = useMemo(
    () => (approveModalRowId ? (allQuery.data ?? []).find((r) => r.id === approveModalRowId) ?? null : null),
    [approveModalRowId, allQuery.data],
  );

  const mutate = useMutation({
    mutationFn: (input: AdminListenerRequestMutationInput) =>
      apiMutation<AdminListenerRequest>(
        `/api/admin/listener-requests/${input.id}`,
        "PATCH",
        input.action === "assign"
          ? { action: "assign", listenerId: input.listenerId }
          : input.action === "approve"
            ? {
                action: "approve",
                ...(input.approve.meetingLink?.trim()
                  ? { meetingLink: input.approve.meetingLink.trim() }
                  : {}),
                ...(input.approve.notes ? { notes: input.approve.notes } : {}),
                ...(input.approve.description ? { description: input.approve.description } : {}),
              }
            : input.action === "update"
              ? { action: "update", ...input.update }
            : { action: "decline" },
      ),
    onSuccess: (_data, variables) => {
      if (variables.action === "approve") {
        setApproveModalRowId(null);
        setApproveMeetingLink("");
        setApproveNotes("");
        setApproveDescription("");
      }
      if (variables.action === "assign") {
        setAssignRequestId(null);
        setTab("ASSIGNED");
      }
      if (variables.action === "update") {
        setEditRequestId(null);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listener-requests"] });
    },
  });

  useEffect(() => {
    if (!approveModalRowId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [approveModalRowId]);

  useEffect(() => {
    if (!approveModalRowId || mutate.isPending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setApproveModalRowId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [approveModalRowId, mutate.isPending]);

  const pendingCount = counts.PENDING;
  const greeting =
    pendingCount > 0
      ? `There are ${pendingCount} pending request${pendingCount === 1 ? "" : "s"} in the queue today.`
      : "No unassigned requests right now — you're caught up.";

  return (
    <div className="space-y-6">
      <motion.section
        className="rounded-[1.25rem] border border-theme-muted/80 bg-[#faf8f5] p-6 md:p-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight text-theme-heading md:text-4xl">
          Session requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5c574f]">
          Welcome back. {greeting} Assign a listener, confirm when ready, or edit request details.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <motion.div
            className="inline-flex rounded-xl border border-theme-muted bg-[#f0ebe3]/60 p-1"
            role="tablist"
            aria-label="Request status"
          >
            {(["PENDING", "ASSIGNED", "APPROVED"] as const).map((key) => {
              const active = tab === key;
            return (
              <button
                  key={key}
                type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                      ? "bg-white text-theme-heading shadow-sm"
                      : "text-[#5c574f] hover:text-theme-heading"
                }`}
              >
                  {TAB_LABELS[key]} ({counts[key]})
              </button>
            );
          })}
          </motion.div>

          <label className="flex items-center gap-2 text-sm text-[#5c574f]">
            <span className="font-medium">Sort by:</span>
            <select
              value={sortNewest ? "newest" : "oldest"}
              onChange={(e) => setSortNewest(e.target.value === "newest")}
              className="rounded-lg border border-theme-muted bg-white px-3 py-1.5 text-sm font-semibold text-theme-heading outline-none focus:border-[#2f6f5b]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </motion.section>

      {allQuery.error ? (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-theme-status-error shadow-sm">
          {allQuery.error.message}
        </p>
      ) : null}

      {allQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ListenerRequestCardSkeleton key={idx} />
          ))}
        </div>
        ) : rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-theme-muted bg-white px-6 py-12 text-center text-sm text-[#5c574f]">
          No {TAB_LABELS[tab].toLowerCase()} requests.
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <SessionRequestCard
                key={row.id}
              row={row}
              tab={tab}
              menuOpen={menuOpenId === row.id}
              onToggleMenu={() =>
                setMenuOpenId((current) => (current === row.id ? null : row.id))
              }
              onAssign={() => {
                setMenuOpenId(null);
                setAssignRequestId(row.id);
              }}
              onConfirm={() => {
                setMenuOpenId(null);
                setApproveModalRowId(row.id);
                setApproveMeetingLink("");
                setApproveNotes("");
                setApproveDescription("");
              }}
              onEdit={() => {
                setMenuOpenId(null);
                setEditRequestId(row.id);
              }}
              onDecline={() => mutate.mutate({ id: row.id, action: "decline" })}
              onOpenSession={() => {
                        const sessionId = row.session?.id;
                        if (!sessionId) return;
                        void (async () => {
                  const detail = await apiFetch<ApiCareSession>(`/api/sessions/${sessionId}`);
                          openSessionDetails(detail);
                        })();
                      }}
              isPending={mutate.isPending}
              errorMessage={
                mutate.error && mutate.variables?.id === row.id ? mutate.error.message : null
              }
            />
          ))}
                  </div>
      )}

      <AdminListenerAssignModal
        open={Boolean(assignRequestId && assignRequest)}
        request={
          assignRequest
            ? {
                id: assignRequest.id,
                preferredDate: assignRequest.preferredDate,
                preferredTime: assignRequest.preferredTime,
                duration: assignRequest.duration,
                note: assignRequest.note,
                emotionalTags: assignRequest.emotionalTags,
                user: assignRequest.user,
              }
            : null
        }
        listeners={listeners}
        isPending={mutate.isPending && mutate.variables?.action === "assign"}
        onClose={() => setAssignRequestId(null)}
        onConfirm={(listenerId) => {
          if (!assignRequestId) return;
          mutate.mutate({ id: assignRequestId, action: "assign", listenerId });
        }}
      />

      <AdminListenerRequestEditModal
        open={Boolean(editRequestId && editRequest)}
        request={
          editRequest
            ? {
                id: editRequest.id,
                preferredDate: editRequest.preferredDate,
                preferredTime: editRequest.preferredTime,
                duration: editRequest.duration,
                emotionalTags: editRequest.emotionalTags,
                preferredTone: editRequest.preferredTone,
                preferredLanguage: editRequest.preferredLanguage,
                note: editRequest.note,
                user: editRequest.user,
              }
            : null
        }
        isPending={mutate.isPending && mutate.variables?.action === "update"}
        onClose={() => setEditRequestId(null)}
        onSave={(update) => {
          if (!editRequestId) return;
          mutate.mutate({ id: editRequestId, action: "update", update });
        }}
      />

      <AnimatePresence>
        {approveModalRowId && approveModalRow ? (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-listener-title"
          >
            <motion.button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-[#0d2f2a]/40 backdrop-blur-[4px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: easeCalm }}
              onClick={() => !mutate.isPending && setApproveModalRowId(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-[1.25rem] border border-white/60 bg-white shadow-[0_28px_80px_-24px_rgb(13_47_42/50%)]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={morphTransition}
            >
              <motion.div className="border-b border-theme-muted px-6 py-5">
              <h2
                id="approve-listener-title"
                  className="font-display text-[22px] font-semibold text-theme-heading"
              >
                  Confirm session
              </h2>
                <p className="mt-1 text-sm text-[#8a8278]">
                  {approveModalRow.user.name ?? approveModalRow.user.email} ·{" "}
                  {preferredWhenLabel(
                    approveModalRow.preferredDate,
                    approveModalRow.preferredTime,
                  )}{" "}
                  · {approveModalRow.duration} mins
                  {approveModalRow.assignedListener
                    ? ` · ${approveModalRow.assignedListener.name ?? approveModalRow.assignedListener.email}`
                    : ""}
                </p>
              </motion.div>

              <motion.div className="space-y-4 px-6 py-5">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                  Meeting link (optional)
                  <input
                    type="text"
                    inputMode="url"
                    value={approveMeetingLink}
                    onChange={(e) => setApproveMeetingLink(e.target.value)}
                    placeholder="https://…"
                    className="mt-1.5 w-full rounded-xl border border-theme-muted bg-theme-surface-muted px-3 py-2.5 text-sm text-theme-heading outline-none focus:border-[#2f6f5b] focus:bg-white"
                  />
                </label>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                  Session notes (optional)
                  <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-y rounded-xl border border-theme-muted bg-theme-surface-muted px-3 py-2.5 text-sm text-theme-heading outline-none focus:border-[#2f6f5b] focus:bg-white"
                  />
                </label>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                  Session description (optional)
                  <textarea
                    value={approveDescription}
                    onChange={(e) => setApproveDescription(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full resize-y rounded-xl border border-theme-muted bg-theme-surface-muted px-3 py-2.5 text-sm text-theme-heading outline-none focus:border-[#2f6f5b] focus:bg-white"
                  />
                </label>
                {mutate.error && mutate.variables?.action === "approve" ? (
                  <p className="text-sm font-semibold text-theme-status-error">{mutate.error.message}</p>
              ) : null}
              </motion.div>

              <motion.div className="flex justify-end gap-3 border-t border-theme-muted bg-[#faf8f5] px-6 py-4">
                <button
                  type="button"
                  disabled={mutate.isPending}
                  onClick={() => setApproveModalRowId(null)}
                  className="text-sm font-semibold text-[#5c574f] hover:text-theme-heading disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  disabled={mutate.isPending}
                  onClick={() =>
                    mutate.mutate({
                      id: approveModalRowId,
                      action: "approve",
                      approve: {
                        ...(approveMeetingLink.trim()
                          ? { meetingLink: approveMeetingLink.trim() }
                          : {}),
                        ...(approveNotes.trim() ? { notes: approveNotes.trim() } : {}),
                        ...(approveDescription.trim()
                          ? { description: approveDescription.trim() }
                          : {}),
                      },
                    })
                  }
                  className="rounded-xl bg-theme-button-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4a3d] disabled:opacity-50"
                  whileHover={{ scale: mutate.isPending ? 1 : 1.02 }}
                  whileTap={{ scale: mutate.isPending ? 1 : 0.98 }}
                  transition={hoverLiftTransition}
                >
                  {mutate.isPending ? "Creating…" : "Capture hold & create session"}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type SessionRequestCardProps = {
  row: AdminListenerRequest;
  tab: TabKey;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAssign: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  onDecline: () => void;
  onOpenSession: () => void;
  isPending: boolean;
  errorMessage: string | null;
};

function SessionRequestCard({
  row,
  tab,
  menuOpen,
  onToggleMenu,
  onAssign,
  onConfirm,
  onEdit,
  onDecline,
  onOpenSession,
  isPending,
  errorMessage,
}: SessionRequestCardProps) {
  const isUrgent =
    row.note?.toLowerCase().includes("urgent") ||
    row.emotionalTags.some((t) => t.toLowerCase().includes("urgent"));

  return (
    <motion.article
      className="relative flex flex-col rounded-[1.25rem] border border-theme-muted bg-white p-5 shadow-[0_8px_32px_-12px_rgb(36_50_48/12%)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {isUrgent ? (
        <span
          className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#cf4f45]"
          aria-label="Urgent"
        />
      ) : null}

      <div className="flex items-start gap-3">
        <UserAvatarCircle
          name={row.user.name}
          email={row.user.email}
          image={row.user.image}
          className="h-11 w-11 shrink-0"
          fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#9bc4ae] text-theme-status-success text-sm"
        />
        <div className="min-w-0 flex-1 pr-6">
          <p className="font-semibold text-theme-heading">{row.user.name ?? row.user.email}</p>
          <p className="text-xs text-[#8a8278]">{memberSubtitle(row)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#fff0e0] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#a66a00]">
          Listening
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
            Preferred time
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#3d3832]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-theme-status-success" aria-hidden>
              <path
                fill="currentColor"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 4h8v8H6V6z"
              />
            </svg>
            {preferredWhenLabel(row.preferredDate, row.preferredTime)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
            Method
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#3d3832]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-theme-status-success" aria-hidden>
              <path
                fill="currentColor"
                d="M4 4h8v8H4V4zm10 2h2v10h-2V6zm-4 10h6v2H10v-2z"
              />
            </svg>
            Listening session
          </p>
        </div>
      </div>

      {row.note ? (
        <div className="mt-4 rounded-xl bg-[#f5f3ef] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
            Member notes
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#5c574f]">&ldquo;{row.note}&rdquo;</p>
        </div>
      ) : null}

      {row.assignedListener ? (
        <p className="mt-3 text-xs text-[#8a8278]">
          Assigned to{" "}
          <span className="font-semibold text-theme-heading">
            {row.assignedListener.name ?? row.assignedListener.email}
          </span>
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        {tab === "PENDING" ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={onAssign}
              className="min-w-0 flex-1 rounded-xl bg-[#1e4a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-theme-button-primary disabled:opacity-50"
            >
              Assign provider
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onEdit}
              className="rounded-xl border border-theme-muted bg-[#f5f3ef] px-4 py-2.5 text-sm font-semibold text-[#3d3832] transition hover:bg-[#ebe6de] disabled:opacity-50"
            >
              Edit details
            </button>
          </>
        ) : null}

        {tab === "ASSIGNED" ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={onConfirm}
              className="min-w-0 flex-1 rounded-xl bg-[#1e4a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-theme-button-primary disabled:opacity-50"
            >
              Confirm session
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onEdit}
              className="rounded-xl border border-theme-muted bg-[#f5f3ef] px-4 py-2.5 text-sm font-semibold text-[#3d3832] transition hover:bg-[#ebe6de] disabled:opacity-50"
            >
              Edit details
            </button>
          </>
        ) : null}

        {tab === "APPROVED" && row.session ? (
          <button
            type="button"
            onClick={onOpenSession}
            className="flex-1 rounded-xl bg-[#1e4a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-theme-button-primary"
          >
            Open session
          </button>
        ) : null}

        <div className="relative">
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-muted text-[#5c574f] hover:bg-[#f5f3ef]"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
              <circle cx="4" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="16" cy="10" r="1.5" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="absolute bottom-full right-0 z-10 mb-1 min-w-[10rem] rounded-xl border border-theme-muted bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={onEdit}
                className="block w-full px-4 py-2 text-left text-sm text-theme-heading hover:bg-[#f5f3ef]"
              >
                Edit details
              </button>
              {tab !== "APPROVED" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onDecline}
                  className="block w-full px-4 py-2 text-left text-sm text-theme-status-error hover:bg-[#fdecea] disabled:opacity-50"
                >
                  Decline request
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-2 text-xs font-semibold text-theme-status-error">{errorMessage}</p>
      ) : null}

      <p className="mt-2 text-[10px] text-[#b5aea3]">
        Created {formatDateTime(row.createdAt)}
      </p>
    </motion.article>
  );
}
