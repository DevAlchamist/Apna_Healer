"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { AdminCreateClubModal } from "@/components/admin/admin-create-club-modal";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency, formatShortDate } from "@/lib/display";
import type { ApiClubCreationRequest, ApiClubDetail, ApiClubJoinRequest } from "@/types/api";

type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED";
type VisibilityFilter = "ALL" | "PUBLIC" | "PRIVATE";

function inferSphereTag(title: string): string {
  const t = title.toLowerCase();
  if (/grief|loss/i.test(t)) return "Grief Support";
  if (/breath|meditat|still/i.test(t)) return "Mindfulness";
  if (/anxiety|quiet|calm/i.test(t)) return "Anxiety Support";
  if (/move|yoga|body/i.test(t)) return "Mindful Movement";
  return "Wellness";
}

function sphereBadgeClass(sphere: string): string {
  const s = sphere.toLowerCase();
  if (s.includes("grief")) return "bg-[#ebe4d6] text-[#5c5348]";
  if (s.includes("mindful") || s.includes("movement")) return "bg-[#d8ebe8] text-[#2a5c52]";
  if (s.includes("anxiety")) return "bg-[#e8e0f0] text-[#5c4a6e]";
  return "bg-[#dceee6] text-[#2f745f]";
}

function clubStatusLabel(status: ApiClubDetail["status"]): string {
  if (status === "ACTIVE") return "Active";
  if (status === "DRAFT") return "Draft";
  if (status === "ARCHIVED") return "Archived";
  return status;
}

function clubDescription(club: ApiClubDetail): string {
  return (
    club.description?.trim() ||
    club.purpose?.trim() ||
    club.subtitle?.trim() ||
    "—"
  );
}

function estMonthlyRevenue(club: ApiClubDetail): number {
  return club.memberCount * Number(club.monthlyFee);
}

function creationRequestTags(req: ApiClubCreationRequest): string[] {
  const tags = [inferSphereTag(req.title)];
  if (req.onboardingStepCount > 0) tags.push("Onboarding");
  if (Number(req.monthlyFee) > 0) tags.push(`₹${req.monthlyFee}/mo`);
  return tags;
}

function requestDescription(req: ApiClubCreationRequest): string {
  return (
    req.description?.trim() ||
    req.purpose?.trim() ||
    req.subtitle?.trim() ||
    "No description provided."
  );
}

function exportClubsCsv(clubs: ApiClubDetail[]) {
  const headers = ["Title", "Slug", "Sphere", "Members", "Monthly fee", "Events", "Status", "Visibility"];
  const rows = clubs.map((c) => [
    c.title,
    c.slug,
    c.sphere,
    String(c.memberCount),
    c.monthlyFee,
    String(c.eventCount ?? 0),
    c.status,
    c.visibility,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clubs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#5f6b69]">
      <span className="whitespace-nowrap font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#e4e8e6] bg-[#faf9f6] px-3 py-1.5 text-sm font-semibold text-[#1f2827] outline-none focus:border-[#2f745f]/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClubActionsMenu({ club }: { club: ApiClubDetail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="grid h-8 w-8 place-content-center rounded-lg text-[#6b7573] transition hover:bg-[#f0f0ed]"
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-[#ebe8e2] bg-white py-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]">
          <Link
            href={`/clubs/${club.slug}`}
            className="block px-4 py-2 text-sm text-[#3d4543] hover:bg-[#f8f6f2]"
            onClick={() => setOpen(false)}
          >
            Public page
          </Link>
          <Link
            href={`/dashboard/clubs/${club.slug}`}
            className="block px-4 py-2 text-sm text-[#3d4543] hover:bg-[#f8f6f2]"
            onClick={() => setOpen(false)}
          >
            Dashboard manage
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AdminClubsPage() {
  const queryClient = useQueryClient();
  const detailRef = useRef<HTMLElement>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL");
  const [sphereFilter, setSphereFilter] = useState("ALL");
  const [showAllJoins, setShowAllJoins] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const clubsQuery = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: () => apiFetch<ApiClubDetail[]>("/api/admin/clubs"),
  });

  const creationQuery = useQuery({
    queryKey: ["admin-club-creation-requests"],
    queryFn: () =>
      apiFetch<ApiClubCreationRequest[]>("/api/admin/clubs/creation-requests?status=PENDING"),
  });

  const joinQuery = useQuery({
    queryKey: ["admin-club-join-requests"],
    queryFn: () => apiFetch<ApiClubJoinRequest[]>("/api/admin/clubs/join-requests?status=PENDING"),
  });

  const allClubs = clubsQuery.data ?? [];
  const creationRequests = creationQuery.data ?? [];
  const joinRequests = joinQuery.data ?? [];
  const visibleJoins = showAllJoins ? joinRequests : joinRequests.slice(0, 5);

  const spheres = useMemo(() => {
    const set = new Set(allClubs.map((c) => c.sphere).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [allClubs]);

  const filteredClubs = useMemo(() => {
    return allClubs.filter((club) => {
      if (statusFilter !== "ALL" && club.status !== statusFilter) return false;
      if (visibilityFilter !== "ALL" && club.visibility !== visibilityFilter) return false;
      if (sphereFilter !== "ALL" && club.sphere !== sphereFilter) return false;
      return true;
    });
  }, [allClubs, statusFilter, visibilityFilter, sphereFilter]);

  const selected = useMemo(
    () => filteredClubs.find((c) => c.id === selectedId) ?? filteredClubs[0] ?? null,
    [filteredClubs, selectedId],
  );

  useEffect(() => {
    if (selected && selectedId !== selected.id) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  const metrics = useMemo(() => {
    const active = allClubs.filter((c) => c.status === "ACTIVE");
    const totalMembers = active.reduce((sum, c) => sum + c.memberCount, 0);
    const estRevenue = active.reduce((sum, c) => sum + estMonthlyRevenue(c), 0);
    const totalEvents = active.reduce((sum, c) => sum + (c.eventCount ?? 0), 0);
    const pending = creationRequests.length + joinRequests.length;
    return { totalClubs: allClubs.length, activeCount: active.length, totalMembers, estRevenue, totalEvents, pending };
  }, [allClubs, creationRequests.length, joinRequests.length]);

  const scrollToDetail = useCallback(() => {
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const reviewCreation = useMutation({
    mutationFn: (input: { id: string; status: "APPROVED" | "REJECTED" }) => {
      setReviewingId(input.id);
      return apiMutation(`/api/admin/clubs/creation-requests/${input.id}`, "PATCH", {
        status: input.status,
      });
    },
    onSettled: () => setReviewingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-club-creation-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-clubs"] });
    },
  });

  const reviewJoin = useMutation({
    mutationFn: (input: { id: string; clubSlug: string; status: "APPROVED" | "REJECTED" }) => {
      setReviewingId(input.id);
      return apiMutation(`/api/clubs/${input.clubSlug}/join-requests/${input.id}`, "PATCH", {
        status: input.status,
      });
    },
    onSettled: () => setReviewingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-club-join-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-clubs"] });
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-[42px]">
            Clubs
          </h1>
          <p className="mt-4 text-base leading-8 text-[#6b7573]">
            Manage community circles, review new club proposals, and approve member join requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportClubsCsv(filteredClubs)}
            className="inline-flex items-center gap-2 rounded-full border border-[#e4e8e6] bg-white px-5 py-2.5 text-sm font-semibold text-[#3d4543] transition hover:border-[#cfd4d2]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 2v8M5 9l3 3 3-3M3 12h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2f745f] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(47,116,95,0.55)] transition hover:bg-[#245d4c]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Create club
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-[#ebe8e2] bg-white px-5 py-4 shadow-[0_8px_32px_-24px_rgba(0,0,0,0.12)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-lg bg-[#f0f0ed] px-4 py-2 text-sm font-semibold text-[#1f2827]">
            All clubs
          </span>
          <FilterSelect
            label="Status:"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "ALL", label: "Any" },
              { value: "ACTIVE", label: "Active" },
              { value: "DRAFT", label: "Draft" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
          />
          <FilterSelect
            label="Visibility:"
            value={visibilityFilter}
            onChange={(v) => setVisibilityFilter(v as VisibilityFilter)}
            options={[
              { value: "ALL", label: "Any" },
              { value: "PUBLIC", label: "Public" },
              { value: "PRIVATE", label: "Private" },
            ]}
          />
          <FilterSelect
            label="Sphere:"
            value={sphereFilter}
            onChange={setSphereFilter}
            options={spheres.map((s) => ({
              value: s,
              label: s === "ALL" ? "All" : s,
            }))}
          />
        </div>
        <p className="text-sm text-[#9aa5a2]">
          Displaying {filteredClubs.length} of {allClubs.length} clubs
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total clubs", value: String(metrics.totalClubs), sub: `${metrics.activeCount} active` },
          {
            label: "Community members",
            value: String(metrics.totalMembers),
            sub: "Across active clubs",
          },
          {
            label: "Est. monthly fees",
            value: formatCurrency(metrics.estRevenue),
            sub: "Members × club fee",
          },
          {
            label: "Pending reviews",
            value: String(metrics.pending),
            sub: `${creationRequests.length} creations · ${joinRequests.length} joins`,
            alert: metrics.pending > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[20px] border border-[#ebe8e2] bg-white p-5 shadow-[0_8px_32px_-24px_rgba(0,0,0,0.1)]"
          >
            <p className="text-sm font-medium text-[#6b7573]">{card.label}</p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-[-0.02em] ${
                card.alert ? "text-[#c44f3f]" : "text-[#1f2827]"
              }`}
            >
              {card.value}
            </p>
            <p className={`mt-1 text-xs ${card.alert ? "font-semibold text-[#c44f3f]" : "text-[#9aa5a2]"}`}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Clubs table */}
      <div className="overflow-hidden rounded-[20px] border border-[#ebe8e2] bg-white shadow-[0_12px_40px_-28px_rgba(0,0,0,0.14)]">
        {clubsQuery.isLoading ? (
          <div className="h-64 animate-pulse bg-[#f4f4f2]" />
        ) : filteredClubs.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="font-semibold text-[#1f2827]">No clubs match your filters</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 text-sm font-semibold text-[#2f745f] underline"
            >
              Create your first club
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#f0f0ed] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa5a2]">
                  <th className="px-6 py-4">Club</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="px-4 py-4">Members</th>
                  <th className="px-4 py-4">Monthly fee</th>
                  <th className="px-4 py-4">Events</th>
                  <th className="px-4 py-4">Visibility</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredClubs.map((club) => {
                  const isSelected = selected?.id === club.id;
                  const desc = clubDescription(club);
                  const memberPct = Math.min(100, Math.round((club.memberCount / 500) * 100));

                  return (
                    <tr
                      key={club.id}
                      onClick={() => setSelectedId(club.id)}
                      className={`cursor-pointer border-b border-[#f8f6f2] transition last:border-0 ${
                        isSelected ? "bg-[#f0f7f4]" : "hover:bg-[#faf9f6]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center bg-[#e8e6e1]"
                            style={
                              club.heroImageUrl
                                ? { backgroundImage: `url(${club.heroImageUrl})` }
                                : undefined
                            }
                          >
                            {!club.heroImageUrl ? (
                              <span className="flex h-full w-full items-center justify-center text-lg text-[#9aa5a2]">
                                ◉
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f2827]">{club.title}</p>
                            <span
                              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sphereBadgeClass(club.sphere)}`}
                            >
                              {club.sphere}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-4">
                        <p className="line-clamp-2 text-xs leading-5 text-[#5f6b69]">{desc}</p>
                        <p className="mt-1 font-mono text-[10px] text-[#9aa5a2]">/{club.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#5f6b69]">
                          <span>{club.memberCountLabel}</span>
                          <span>{club.memberCount}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0f0ed]">
                          <div
                            className="h-full rounded-full bg-[#2f745f]"
                            style={{ width: `${memberPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#1f2827]">
                        {formatCurrency(club.monthlyFee)}
                        <span className="block text-[10px] font-normal text-[#9aa5a2]">/ month</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-[#1f2827]">{club.eventCount ?? 0}</span>
                        <span className="block text-[10px] text-[#9aa5a2]">linked events</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-[#5f6b69]">
                          {club.visibility === "PUBLIC" ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            club.status === "ACTIVE"
                              ? "bg-[#e5efe9] text-[#2f745f]"
                              : "bg-[#f0f0ed] text-[#6b7573]"
                          }`}
                        >
                          {clubStatusLabel(club.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ClubActionsMenu club={club} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected club detail */}
      {selected ? (
        <motion.section
          ref={detailRef}
          layout
          className="rounded-[20px] border border-[#ebe8e2] bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.12)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0f0ed] pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa5a2]">
                Club details
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1f2827]">
                {selected.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7573]">{selected.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/clubs/${selected.slug}`}
                className="text-sm font-semibold text-[#2f745f] underline underline-offset-4"
              >
                View public page
              </Link>
              <Link
                href={`/dashboard/clubs/${selected.slug}`}
                className="text-sm font-semibold text-[#6b7573] hover:text-[#2f745f]"
              >
                Dashboard →
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Members", value: selected.memberCountLabel },
              { label: "Monthly fee", value: formatCurrency(selected.monthlyFee) },
              { label: "Events", value: String(selected.eventCount ?? 0) },
              { label: "Est. revenue", value: formatCurrency(estMonthlyRevenue(selected)) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#f8f6f2] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa5a2]">
                  {item.label}
                </p>
                <p className="mt-1 font-semibold text-[#1f2827]">{item.value}</p>
              </div>
            ))}
          </div>

          {selected.description || selected.purpose ? (
            <p className="mt-5 text-sm leading-7 text-[#5f6b69]">
              {selected.description ?? selected.purpose}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6b7573]">
            <span>{selected.onboardingSteps.length} onboarding questions</span>
            <span>·</span>
            <span>{selected.reviews.length} testimonials</span>
            <span>·</span>
            <span>{selected.galleryUrls.length} gallery images</span>
            <span>·</span>
            <span>{clubStatusLabel(selected.status)} · {selected.visibility.toLowerCase()}</span>
          </div>
        </motion.section>
      ) : null}

      {/* Pending requests */}
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#1f2827]">Club creation requests</h2>
            <span className="rounded-full bg-[#f0f0ed] px-3 py-1 text-xs font-semibold text-[#5f6b69]">
              {creationRequests.length} pending
            </span>
          </div>
          {creationQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-[20px] bg-[#eceae6]" />
          ) : creationRequests.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-[#d5dbd8] bg-white px-6 py-10 text-center text-sm text-[#6b7573]">
              No pending creation requests.
            </p>
          ) : (
            <div className="space-y-4">
              {creationRequests.map((req) => {
                const isBusy = reviewingId === req.id && reviewCreation.isPending;
                const proposer = req.user?.name ?? req.user?.email ?? "Member";
                return (
                  <article
                    key={req.id}
                    className="rounded-[20px] border border-[#ebe8e2] bg-white p-5 shadow-[0_8px_28px_-20px_rgba(0,0,0,0.12)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-semibold text-[#1f2827]">{req.title}</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => reviewCreation.mutate({ id: req.id, status: "APPROVED" })}
                          className="rounded-full bg-[#2f745f] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => reviewCreation.mutate({ id: req.id, status: "REJECTED" })}
                          className="rounded-full bg-[#f0f0ed] px-4 py-1.5 text-xs font-semibold text-[#3d4543] disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#6b7573]">
                      Proposed by <span className="font-semibold text-[#2f745f]">{proposer}</span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-[#5f6b69]">{requestDescription(req)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {creationRequestTags(req).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#ebe4d6] px-2.5 py-0.5 text-[10px] font-semibold text-[#5c5348]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-[#ebe8e2] bg-white p-5 shadow-[0_8px_28px_-20px_rgba(0,0,0,0.1)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#1f2827]">Member join requests</h2>
            <span className="rounded-full bg-[#f0f0ed] px-3 py-1 text-xs font-semibold text-[#5f6b69]">
              {joinRequests.length} pending
            </span>
          </div>
          {joinQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[#f4f4f2]" />
              ))}
            </div>
          ) : joinRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6b7573]">No pending membership requests.</p>
          ) : (
            <ul className="divide-y divide-[#f0f0ed]">
              {visibleJoins.map((req) => {
                const isBusy = reviewingId === req.id && reviewJoin.isPending;
                const name = req.user?.name ?? req.user?.email ?? "Member";
                const clubTitle = req.club?.title ?? "a club";
                return (
                  <li key={req.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-3">
                      <UserAvatarCircle
                        name={name}
                        email={req.user?.email}
                        image={req.user?.image}
                        className="h-10 w-10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-[#3d4543]">
                          <span className="font-semibold text-[#1f2827]">{name}</span> wants to join{" "}
                          <button
                            type="button"
                            className="font-semibold text-[#2f745f] hover:underline"
                            onClick={() => {
                              const club = allClubs.find((c) => c.slug === req.club?.slug);
                              if (club) {
                                setSelectedId(club.id);
                                scrollToDetail();
                              }
                            }}
                          >
                            {clubTitle}
                          </button>
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa5a2]">
                          Requested {formatShortDate(req.createdAt)}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={isBusy || !req.club?.slug}
                            onClick={() =>
                              reviewJoin.mutate({
                                id: req.id,
                                clubSlug: req.club!.slug,
                                status: "APPROVED",
                              })
                            }
                            className="rounded-full bg-[#2f745f] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || !req.club?.slug}
                            onClick={() =>
                              reviewJoin.mutate({
                                id: req.id,
                                clubSlug: req.club!.slug,
                                status: "REJECTED",
                              })
                            }
                            className="rounded-full bg-[#f0f0ed] px-3 py-1 text-xs font-semibold text-[#3d4543] disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {joinRequests.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAllJoins((v) => !v)}
              className="mt-4 text-sm font-semibold text-[#2f745f] hover:underline"
            >
              {showAllJoins ? "Show fewer" : "View all join requests"}
            </button>
          ) : null}
        </section>
      </div>

      <AdminCreateClubModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
