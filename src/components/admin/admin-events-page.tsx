"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AdminCreateEventModal } from "@/components/admin/admin-create-event-modal";
import { AdminEditEventModal } from "@/components/admin/admin-edit-event-modal";
import { EventRegistrationsTable } from "@/components/events/event-registrations-table";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiEventDetail, ApiEventRegistrationRow } from "@/types/api";

type StatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "CANCELLED" | "COMPLETED";
type OccupancyFilter = "ALL" | "HIGH" | "FULL" | "LOW";

function filledSeats(event: ApiEventDetail): number {
  return Math.max(0, event.capacity - event.seatsRemaining);
}

function occupancyPct(event: ApiEventDetail): number {
  if (event.capacity <= 0) return 0;
  return Math.round((filledSeats(event) / event.capacity) * 100);
}

function eventRevenue(event: ApiEventDetail): number {
  return filledSeats(event) * Number(event.basePrice);
}

function statusLabel(status: ApiEventDetail["status"]): string {
  if (status === "PUBLISHED") return "Published";
  if (status === "DRAFT") return "Draft";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "COMPLETED") return "Completed";
  return status;
}

function categoryBadgeClass(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("workshop")) return "bg-[#dceee6] text-theme-status-success";
  if (c.includes("meditat")) return "bg-[#ebe4d6] text-[#5c5348]";
  if (c.includes("heal")) return "bg-[#d8ebe8] text-[#2a5c52]";
  return "bg-[#f0f0ed] text-theme-muted";
}

function scheduleLine(event: ApiEventDetail): string {
  const parts = [event.dateLabel, event.timeLabel].filter(Boolean);
  return parts.join(", ") || new Date(event.startsAt).toLocaleString();
}

function providerName(event: ApiEventDetail): string {
  const name = event.facilitatorName ?? event.host;
  return name ? `with ${name}` : "";
}

function exportEventsCsv(events: ApiEventDetail[]) {
  const headers = ["Title", "Category", "Schedule", "Occupancy", "Revenue", "Status"];
  const rows = events.map((e) => [
    e.title,
    e.category,
    scheduleLine(e),
    `${filledSeats(e)}/${e.capacity}`,
    String(eventRevenue(e)),
    e.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`;
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
    <label className="flex items-center gap-2 text-sm text-theme-muted">
      <span className="whitespace-nowrap font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#e4e8e6] bg-theme-surface-muted px-3 py-1.5 text-sm font-semibold text-theme-heading outline-none focus:border-[#2f745f]/40"
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

function EventActionsMenu({
  event,
  onViewRegistrations,
  onEdit,
}: {
  event: ApiEventDetail;
  onViewRegistrations: () => void;
  onEdit: () => void;
}) {
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
        className="grid h-8 w-8 place-content-center rounded-lg text-theme-muted transition hover:bg-[#f0f0ed]"
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-theme-muted bg-white py-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-[#3d4543] hover:bg-theme-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setOpen(false);
            }}
          >
            Edit event
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-[#3d4543] hover:bg-theme-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              onViewRegistrations();
              setOpen(false);
            }}
          >
            View registrations
          </button>
          <Link
            href={`/events/${event.slug}`}
            className="block px-4 py-2 text-sm text-[#3d4543] hover:bg-theme-surface-muted"
            onClick={() => setOpen(false)}
          >
            Public page
          </Link>
          <Link
            href={`/dashboard/events/${event.slug}`}
            className="block px-4 py-2 text-sm text-[#3d4543] hover:bg-theme-surface-muted"
            onClick={() => setOpen(false)}
          >
            Dashboard view
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AdminEventsPage() {
  const queryClient = useQueryClient();
  const registrationsRef = useRef<HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<ApiEventDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>("ALL");

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const categoriesListQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiFetch<Array<{ id: string; name: string }>>("/api/admin/events/categories"),
  });
  const categoriesList = categoriesListQuery.data ?? [];

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => apiMutation("/api/admin/events/categories", "POST", { name }),
    onSuccess: () => {
      setNewCategoryName("");
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["event-categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiMutation(`/api/admin/events/categories?id=${id}`, "DELETE"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => apiFetch<ApiEventDetail[]>("/api/admin/events"),
  });

  const allEvents = eventsQuery.data ?? [];

  const categories = useMemo(() => {
    return ["ALL", ...categoriesList.map((c) => c.name).sort()];
  }, [categoriesList]);

  const providers = useMemo(() => {
    const set = new Set(
      allEvents.map((e) => e.facilitatorName ?? e.host).filter(Boolean) as string[],
    );
    return ["ALL", ...Array.from(set).sort()];
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (statusFilter !== "ALL" && event.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && event.category !== categoryFilter) return false;
      const provider = event.facilitatorName ?? event.host;
      if (providerFilter !== "ALL" && provider !== providerFilter) return false;
      const pct = occupancyPct(event);
      if (occupancyFilter === "HIGH" && pct < 80) return false;
      if (occupancyFilter === "FULL" && event.seatsRemaining > 0) return false;
      if (occupancyFilter === "LOW" && pct >= 50) return false;
      return true;
    });
  }, [allEvents, statusFilter, categoryFilter, providerFilter, occupancyFilter]);

  const selected = useMemo(
    () => filteredEvents.find((e) => e.id === selectedId) ?? filteredEvents[0] ?? null,
    [filteredEvents, selectedId],
  );

  useEffect(() => {
    if (selected && selectedId !== selected.id) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  const registrationsQuery = useQuery({
    queryKey: ["admin-event-registrations", selected?.id],
    queryFn: () =>
      apiFetch<ApiEventRegistrationRow[]>(
        `/api/admin/events/${selected!.id}/registrations`,
      ),
    enabled: Boolean(selected?.id),
  });

  const metrics = useMemo(() => {
    const published = allEvents.filter((e) => e.status === "PUBLISHED");
    const revenue = published.reduce((sum, e) => sum + eventRevenue(e), 0);
    const totalCapacity = published.reduce((sum, e) => sum + e.capacity, 0);
    const totalFilled = published.reduce((sum, e) => sum + filledSeats(e), 0);
    const avgAttendance =
      totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 1000) / 10 : 0;
    const fullEvents = published.filter((e) => e.seatsRemaining === 0).length;
    const highDemand = published.filter((e) => occupancyPct(e) >= 80 && e.seatsRemaining > 0).length;

    return {
      revenue,
      avgAttendance,
      totalBookings: totalFilled,
      waitlistSignal: fullEvents + highDemand,
    };
  }, [allEvents]);

  const cancelMutation = useMutation({
    mutationFn: (input: { slug: string; userId: string }) =>
      apiMutation(`/api/events/${input.slug}/cancel-registration`, "POST", {
        userId: input.userId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-event-registrations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const scrollToRegistrations = useCallback(() => {
    registrationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-theme-heading md:text-[42px]">
            Events
          </h1>
          <p className="mt-4 text-base leading-8 text-theme-muted">
            Create and manage wellness gatherings, workshops, and club sessions. Review
            registrations, occupancy, and revenue in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportEventsCsv(filteredEvents)}
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
            onClick={() => setIsCategoriesModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#e4e8e6] bg-white px-5 py-2.5 text-sm font-semibold text-[#3d4543] transition hover:border-[#cfd4d2]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M3 20v-8c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v8M3 12h18" />
            </svg>
            Categories
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-theme-button-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(47,116,95,0.55)] transition hover:bg-theme-button-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Create event
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-theme-muted bg-white px-5 py-4 shadow-[0_8px_32px_-24px_rgba(0,0,0,0.12)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-lg bg-[#f0f0ed] px-4 py-2 text-sm font-semibold text-theme-heading">
            All Events
          </span>
          <FilterSelect
            label="Status:"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "ALL", label: "Any" },
              { value: "PUBLISHED", label: "Active" },
              { value: "DRAFT", label: "Draft" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "COMPLETED", label: "Completed" },
            ]}
          />
          <FilterSelect
            label="Category:"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({
              value: c,
              label: c === "ALL" ? "All" : c,
            }))}
          />
          <FilterSelect
            label="Facilitator:"
            value={providerFilter}
            onChange={setProviderFilter}
            options={providers.map((p) => ({
              value: p,
              label: p === "ALL" ? "All facilitators" : p,
            }))}
          />
          <FilterSelect
            label="Occupancy:"
            value={occupancyFilter}
            onChange={(v) => setOccupancyFilter(v as OccupancyFilter)}
            options={[
              { value: "ALL", label: "Any" },
              { value: "HIGH", label: "> 80%" },
              { value: "FULL", label: "Full" },
              { value: "LOW", label: "< 50%" },
            ]}
          />
        </div>
        <p className="text-sm text-[#9aa5a2]">
          Displaying {filteredEvents.length} of {allEvents.length} events
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Estimated revenue",
            value: formatCurrency(metrics.revenue),
            sub: "From registered seats × base price",
          },
          {
            label: "Average fill rate",
            value: `${metrics.avgAttendance}%`,
            sub: "Across published events",
          },
          {
            label: "Total registrations",
            value: String(metrics.totalBookings),
            sub: "Confirmed seat bookings",
          },
          {
            label: "High-demand events",
            value: String(metrics.waitlistSignal),
            sub: metrics.waitlistSignal > 0 ? "Near capacity or sold out" : "No capacity pressure",
            alert: metrics.waitlistSignal > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[20px] border border-theme-muted bg-white p-5 shadow-[0_8px_32px_-24px_rgba(0,0,0,0.1)]"
          >
            <p className="text-sm font-medium text-theme-muted">{card.label}</p>
            <div className="mt-2 flex items-end gap-2">
              <p
                className={`text-2xl font-semibold tracking-[-0.02em] ${
                  card.alert ? "text-[#c44f3f]" : "text-theme-heading"
                }`}
              >
                {card.value}
              </p>
            </div>
            {card.sub ? (
              <p className={`mt-1 text-xs ${card.alert ? "font-semibold text-[#c44f3f]" : "text-[#9aa5a2]"}`}>
                {card.sub}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Events table */}
      <div className="overflow-hidden rounded-[20px] border border-theme-muted bg-white shadow-[0_12px_40px_-28px_rgba(0,0,0,0.14)]">
        {eventsQuery.isLoading ? (
          <div className="h-64 animate-pulse bg-[#f4f4f2]" />
        ) : filteredEvents.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="font-semibold text-theme-heading">No events match your filters</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 text-sm font-semibold text-theme-status-success underline"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#f0f0ed] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa5a2]">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-4 py-4">Date &amp; facilitator</th>
                  <th className="px-4 py-4">Occupancy</th>
                  <th className="px-4 py-4">Revenue</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const filled = filledSeats(event);
                  const pct = occupancyPct(event);
                  const isFull = event.seatsRemaining === 0;
                  const isSelected = selected?.id === event.id;
                  const waitlistHint = isFull ? 0 : pct >= 80 ? Math.max(1, Math.floor(filled * 0.15)) : 0;

                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedId(event.id)}
                      className={`cursor-pointer border-b border-[#f8f6f2] transition last:border-0 ${
                        isSelected ? "bg-[#f0f7f4]" : "hover:bg-theme-surface-muted"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center bg-[#e8e6e1]"
                            style={
                              event.heroImageUrl
                                ? { backgroundImage: `url(${event.heroImageUrl})` }
                                : undefined
                            }
                          >
                            {!event.heroImageUrl ? (
                              <span className="flex h-full w-full items-center justify-center text-lg text-[#9aa5a2]">
                                ✦
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-theme-heading">{event.title}</p>
                            <span
                              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryBadgeClass(event.category)}`}
                            >
                              {event.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#3d4543]">{scheduleLine(event)}</p>
                        <p className="mt-0.5 text-xs text-[#9aa5a2]">{providerName(event)}</p>
                        {event.clubTitle ? (
                          <p className="mt-0.5 text-xs text-theme-status-success">{event.clubTitle}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-theme-muted">
                          <span>
                            {filled} / {event.capacity}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0f0ed]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? "bg-[#c44f3f]" : pct >= 80 ? "bg-theme-button-primary" : "bg-[#8ab5a5]"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        {isFull ? (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#c44f3f]">
                            Full
                          </p>
                        ) : waitlistHint > 0 ? (
                          <p className="mt-1 text-[10px] text-[#9aa5a2]">Almost full</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 font-semibold text-theme-heading">
                        {formatCurrency(eventRevenue(event))}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            event.status === "PUBLISHED"
                              ? "bg-[#e5efe9] text-theme-status-success"
                              : "bg-[#f0f0ed] text-theme-muted"
                          }`}
                        >
                          {statusLabel(event.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <EventActionsMenu
                          event={event}
                          onViewRegistrations={() => {
                            setSelectedId(event.id);
                            scrollToRegistrations();
                          }}
                          onEdit={() => setEditEvent(event)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registrations panel — same UX as before */}
      {selected ? (
        <motion.section
          ref={registrationsRef}
          layout
          className="rounded-[20px] border border-theme-muted bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.12)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0f0ed] pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa5a2]">
                Registrations
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-theme-heading">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-theme-muted">
                {selected.clubTitle ? `Club: ${selected.clubTitle}` : "Platform-wide event"} ·{" "}
                {filledSeats(selected)} registered · {selected.seatsRemaining} seats remaining
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/events/${selected.slug}`}
                className="text-sm font-semibold text-theme-status-success underline underline-offset-4"
              >
                View live page
              </Link>
              <Link
                href={`/dashboard/events/${selected.slug}`}
                className="text-sm font-semibold text-theme-muted hover:text-theme-status-success"
              >
                Dashboard →
              </Link>
            </div>
          </div>
          <p className="mt-4 text-sm text-theme-muted">
            Base price {formatCurrency(selected.basePrice)} · Members charged:{" "}
            {selected.membersPay ? "Yes" : "No"} · Guests charged:{" "}
            {selected.nonMembersPay ? "Yes" : "No"}
          </p>
          <div className="mt-6">
            <EventRegistrationsTable
              rows={registrationsQuery.data ?? []}
              onCancel={(userId) =>
                cancelMutation.mutate({ slug: selected.slug, userId })
              }
              cancellingUserId={
                cancelMutation.isPending ? cancelMutation.variables?.userId ?? null : null
              }
            />
          </div>
        </motion.section>
      ) : null}

      <AdminCreateEventModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AdminEditEventModal
        open={editEvent !== null}
        event={editEvent}
        onClose={() => setEditEvent(null)}
      />

      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2422]/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-theme-muted bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-muted pb-4">
              <h3 className="font-display text-xl font-semibold text-theme-heading">Event Categories</h3>
              <button
                type="button"
                onClick={() => setIsCategoriesModalOpen(false)}
                className="text-2xl hover:text-theme-muted transition"
              >
                ×
              </button>
            </div>
            
            <div className="mt-4 space-y-4">
              {/* Add New Category */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) return;
                  createCategoryMutation.mutate(newCategoryName.trim());
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded-xl border border-theme-muted bg-theme-surface-muted px-3.5 py-2.5 text-sm text-theme-heading outline-none focus:border-[#2f6f5b]"
                  required
                />
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="rounded-xl bg-[#2f6f5b] hover:bg-[#204a3d] px-4 py-2.5 text-xs font-bold text-white transition"
                >
                  {createCategoryMutation.isPending ? "Adding..." : "Add"}
                </button>
              </form>

              {/* Categories list */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {categoriesList.length === 0 ? (
                  <p className="text-sm text-theme-muted text-center py-4">No categories configured yet.</p>
                ) : (
                  categoriesList.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-xl bg-theme-surface-muted px-3 py-2.5 border border-theme-muted">
                      <span className="text-sm font-medium text-theme-heading">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}
                        disabled={deleteCategoryMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
