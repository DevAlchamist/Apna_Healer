"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { formatSentAgo } from "@/lib/display";
import type { ApiNotificationsListResponse } from "@/types/api";
import { ActivityFeedSkeleton } from "@/components/skeletons";

type NotificationBellProps = {
  panelTitle?: string;
};

export function NotificationBell({ panelTitle = "Notifications" }: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<ApiNotificationsListResponse>("/api/notifications?take=12"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/mark-all-read", {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;
  const items = notificationsQuery.data?.items ?? [];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleItemClick(id: string, href: string | null, readAt: string | null) {
    if (!readAt) {
      markReadMutation.mutate(id);
    }
    setOpen(false);
    if (href) {
      router.push(href);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative rounded-full border bg-white p-2 text-text-primary/70 transition-colors ${
          open ? "border-primary/35 bg-primary/10" : "border-accent/80 hover:bg-accent/45"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 1 1 12 0v4l1.5 2h-15L6 13V9Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2D5A4C] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={panelTitle}
          className="absolute right-0 top-[calc(100%+0.65rem)] z-40 w-[340px] rounded-calm border border-accent/80 bg-white p-4 shadow-[0_16px_40px_-20px_rgb(0_0_0/35%)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-primary/45">
              {panelTitle}
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs font-semibold text-[#2D5A4C] hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="mt-4 max-h-[320px] overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <ActivityFeedSkeleton />
            ) : items.length === 0 ? (
              <p className="rounded-gentle bg-background px-3 py-4 text-sm text-text-primary/60">
                No notifications yet. Updates about bookings, applications, and sessions will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id, item.href, item.readAt)}
                    className={`w-full rounded-gentle px-3 py-2.5 text-left transition hover:bg-accent/30 ${
                      item.readAt ? "bg-background" : "bg-primary/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-primary/55">{item.body}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-text-primary/40">
                      {formatSentAgo(item.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
