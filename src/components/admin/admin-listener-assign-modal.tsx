"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { easeCalm, morphTransition } from "@/components/ui/fade-in";
import type { ApiUser } from "@/types/api";

export type AssignModalRequest = {
  id: string;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  note: string | null;
  emotionalTags: string[];
  user: { id: string; name: string | null; email: string; image: string | null };
};

type AdminListenerAssignModalProps = {
  open: boolean;
  request: AssignModalRequest | null;
  listeners: ApiUser[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (listenerId: string) => void;
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

function matchScore(requestTags: string[], listener: ApiUser): number {
  const strengths = listener.listenerProfile?.emotionalStrengths ?? [];
  const langs = listener.listenerProfile?.languages ?? [];
  const pool = [...strengths, ...langs].map((s) => s.toLowerCase());
  if (!requestTags.length || !pool.length) return 72;
  let hits = 0;
  for (const tag of requestTags) {
    const t = tag.toLowerCase();
    if (pool.some((p) => p.includes(t) || t.includes(p))) hits += 1;
  }
  return Math.min(99, 68 + hits * 10);
}

export function AdminListenerAssignModal({
  open,
  request,
  listeners,
  isPending,
  onClose,
  onConfirm,
}: AdminListenerAssignModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"match" | "all">("match");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
      setFilter("match");
    }
  }, [open]);

  const ranked = useMemo(() => {
    if (!request) return [];
    const q = search.trim().toLowerCase();
    return listeners
      .map((listener) => ({
        listener,
        score: matchScore(request.emotionalTags, listener),
        tags: listener.listenerProfile?.emotionalStrengths ?? [],
      }))
      .filter(({ listener }) => {
        if (!q) return true;
        const hay = [
          listener.name,
          listener.email,
          ...(listener.listenerProfile?.emotionalStrengths ?? []),
          ...(listener.listenerProfile?.languages ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => b.score - a.score);
  }, [listeners, request, search]);

  const visible = useMemo(() => {
    if (filter === "match") return ranked.filter((r) => r.score >= 80).slice(0, 12);
    return ranked.slice(0, 20);
  }, [filter, ranked]);

  if (!open || !request) return null;

  const clientId = request.user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-100 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-listener-title"
      >
        <motion.button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-[#0d2f2a]/40 backdrop-blur-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] border border-white/60 bg-white shadow-[0_28px_80px_-24px_rgb(13_47_42/50%)]"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.99 }}
          transition={morphTransition}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div className="flex items-start justify-between gap-3 border-b border-theme-muted px-6 py-5">
            <h2
              id="assign-listener-title"
              className="font-display text-[20px] font-semibold tracking-tight text-theme-heading sm:text-[22px]"
            >
              Assign listener for {request.user.name ?? "member"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-[#8a8278] hover:bg-[#f4f0ea]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>

          <motion.div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="rounded-2xl border border-theme-muted bg-[#f5f3ef] p-4">
              <div className="flex items-start gap-3">
                <UserAvatarCircle
                  name={request.user.name}
                  email={request.user.email}
                  image={request.user.image}
                  className="h-12 w-12 shrink-0"
                  fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#9bc4ae] text-theme-status-success text-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-theme-heading">
                        {request.user.name ?? request.user.email}
                      </p>
                      <p className="text-xs text-[#8a8278]">Client ID: #{clientId}</p>
                    </div>
                    <span className="rounded-full bg-[#e8f4ee] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1f5c4a]">
                      Priority request
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    Method
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#3d3832]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-theme-status-success" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M4 4h8v8H4V4zm10 2h2v10h-2V6zm-4 10h6v2H10v-2z"
                      />
                    </svg>
                    Listening session
                  </p>
                </div>
                <motion.div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    Preferred time
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#3d3832]">
                    {preferredWhenLabel(request.preferredDate, request.preferredTime)}
                  </p>
                </motion.div>
              </div>

              {request.note ? (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    Note
                  </p>
                  <p className="mt-1 text-sm italic text-[#5c574f]">&ldquo;{request.note}&rdquo;</p>
                </div>
              ) : null}
            </div>

            <div className="relative mt-5">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8278]"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14l4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, specialty, or expertise…"
                className="w-full rounded-xl border border-theme-muted bg-theme-surface-muted py-2.5 pl-10 pr-3 text-sm text-theme-heading outline-none focus:border-[#2f6f5b] focus:bg-white"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("match")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === "match"
                    ? "bg-theme-button-primary text-white"
                    : "bg-[#f0ebe3] text-[#5c574f] hover:bg-[#e4ddd3]"
                }`}
              >
                {filter === "match" ? (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                    <path fill="currentColor" d="M10 3.5L5 9 2.5 6.5l1-1L5 7l4-4.5 1 1z" />
                  </svg>
                ) : null}
                High match
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === "all"
                    ? "bg-theme-button-primary text-white"
                    : "bg-[#f0ebe3] text-[#5c574f] hover:bg-[#e4ddd3]"
                }`}
              >
                All listeners
              </button>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
              Recommended listeners ({visible.length})
            </p>

            <ul className="mt-3 space-y-2">
              {visible.map(({ listener, score, tags }) => {
                const selected = selectedId === listener.id;
                return (
                  <li key={listener.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(listener.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#2f6f5b] bg-[#f0faf4]"
                          : "border-theme-muted bg-white hover:border-[#c9c2b6]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <UserAvatarCircle
                          name={listener.name}
                          email={listener.email}
                          image={listener.image}
                          className="h-10 w-10"
                          fallbackClassName="bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-xs"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-theme-button-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-theme-heading">
                            {listener.name ?? listener.email}
                          </span>
                          <span className="rounded-full bg-[#e8f4ee] px-2 py-0.5 text-[10px] font-bold text-[#1f5c4a]">
                            {score}% match
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-[#f0ebe3] px-1.5 py-0.5 text-[10px] font-medium text-[#5c574f]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          selected
                            ? "bg-theme-button-primary text-white"
                            : "bg-[#f0ebe3] text-[#5c574f]"
                        }`}
                      >
                        {selected ? "Selected" : "Select"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <div className="flex items-center justify-between gap-4 border-t border-theme-muted bg-[#faf8f5] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-sm font-semibold text-[#5c574f] hover:text-theme-heading disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedId || isPending}
              onClick={() => selectedId && onConfirm(selectedId)}
              className="rounded-xl bg-[#6aab8e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-theme-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Assigning…" : "Confirm assignment"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
