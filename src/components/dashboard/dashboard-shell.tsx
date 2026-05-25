"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ActivityFeedSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api-client";
import { getDashboardModules } from "@/config/dashboard-modules";
import {
  displayAccountLabel,
  formatCurrency,
  formatDateTime,
  sessionCounterpartyLabel,
  toSentenceCase,
} from "@/lib/display";
import type { ApiCareSession, ApiTransaction, ApiUser } from "@/types/api";
import {
  useBookSessionModal,
} from "./book-session-modal";
import { ListenerAvailabilityChip } from "./listener-availability-chip";
import { SessionDetailsModalProvider } from "./session-details-modal";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { dashboardSuggestedEvents } from "@/data/events";
import { morphTransition } from "@/components/ui/fade-in";

type DashboardShellProps = {
  children: ReactNode;
};

export function SidebarIcon({
  icon,
}: {
  icon:
    | "reports"
    | "profile"
    | "settings"
    | "plans"
    | "packages"
    | "currency"
    | "dashboard"
    | "blog"
    | "journal"
    | "circle";
}) {
  if (icon === "dashboard") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }

  if (icon === "blog") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "journal") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6z" />
        <path d="M9 4v16M12 8h4M12 12h4" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "circle") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="8" cy="10" r="2.5" />
        <circle cx="16" cy="10" r="2.5" />
        <path
          d="M3.5 18a4.5 4.5 0 0 1 9 0M11.5 18a4.5 4.5 0 0 1 9 0"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "reports") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 16V12M12 16V8M16 16v-5" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 19a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3.2" />
        <path
          d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.1-1.1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.6a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.1-1.1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.6a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-soft px-3 py-2 text-sm font-medium transition-colors duration-300 ease-(--ease-calm) ${
        isActive
          ? "bg-primary/15 text-text-secondary"
          : "text-text-primary/70 hover:bg-accent/50"
      }`}
    >
      {label}
    </Link>
  );
}

export function SidebarItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: Parameters<typeof SidebarIcon>[0]["icon"];
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-gentle px-4 py-3 text-sm transition-colors duration-300 ease-(--ease-calm) ${
        isActive
          ? "bg-primary/15 font-semibold text-text-secondary"
          : "text-text-primary/65 hover:bg-accent/50"
      }`}
    >
      <span className="flex items-center gap-3">
        <SidebarIcon icon={icon} />
        {label}
      </span>
      {isActive ? (
        <span className="h-6 w-1 rounded-full bg-primary" aria-hidden />
      ) : null}
    </Link>
  );
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ReportType = "technical" | "safety" | "billing" | "other";

function describeTransaction(transaction: ApiTransaction) {
  if (transaction.type === "CREDIT") {
    return {
      title: "Wallet topped up",
      detail: formatCurrency(transaction.amount),
    };
  }

  if (transaction.type === "REFUND") {
    return {
      title: "Refund processed",
      detail: formatCurrency(transaction.amount),
    };
  }

  if (transaction.type === "PAYOUT") {
    return {
      title: "Session payout received",
      detail: formatCurrency(transaction.amount),
    };
  }

  if (transaction.type === "DEBIT") {
    return {
      title: "Wallet withdrawal",
      detail: formatCurrency(transaction.amount),
    };
  }

  return {
    title: "Session payment reserved",
    detail: formatCurrency(transaction.amount),
  };
}

function describeSession(
  session: ApiCareSession,
  viewerUserId?: string | null,
) {
  return {
    title: `Session with ${sessionCounterpartyLabel(session, viewerUserId)}`,
    detail: `${session.duration} mins • ${toSentenceCase(session.status)}`,
  };
}

function DashboardShellContent({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { open: openBookSession } = useBookSessionModal();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("safety");
  const isDashboardHome = pathname === "/dashboard";
  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => toTitleCase(segment));

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const transactionsQuery = useQuery({
    queryKey: ["dashboard-shell-transactions"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/transactions?take=4"),
    enabled: isDashboardHome,
  });

  const sessionsQuery = useQuery({
    queryKey: ["dashboard-shell-sessions"],
    queryFn: () => apiFetch<ApiCareSession[]>("/api/sessions?take=8"),
    enabled: isDashboardHome,
  });

  const user = userQuery.data;
  const sidebarName = user
    ? displayAccountLabel(user.name, user.email)
    : userQuery.isLoading
      ? "Loading…"
      : displayAccountLabel(undefined, undefined);
  const sidebarSubtitle = user ? toSentenceCase(user.role) : "Loading profile";
  const walletBalance = formatCurrency(user?.wallet?.availableBalance);
  const role = user?.role ?? null;

  const topNavItems = useMemo(
    () => getDashboardModules({ surface: "dashboard", placement: "top-nav", role }),
    [role],
  );
  const sideNavItems = useMemo(
    () =>
      getDashboardModules({
        surface: "dashboard",
        placement: "sidebar",
        group: "primary",
        role,
      }),
    [role],
  );
  const personalNavItems = useMemo(
    () =>
      getDashboardModules({
        surface: "dashboard",
        placement: "sidebar",
        group: "personal",
        role,
      }),
    [role],
  );
  const recentActivity = useMemo(() => {
    const activity = [
      ...(transactionsQuery.data ?? []).map((transaction) => ({
        id: `txn-${transaction.id}`,
        sortValue: new Date(transaction.createdAt).getTime(),
        date: formatDateTime(transaction.createdAt),
        ...describeTransaction(transaction),
      })),
      ...(sessionsQuery.data ?? []).map((session) => ({
        id: `session-${session.id}`,
        sortValue: new Date(session.startTime).getTime(),
        date: formatDateTime(session.startTime),
        ...describeSession(session, user?.id),
      })),
    ];

    return activity
      .sort((left, right) => right.sortValue - left.sortValue)
      .slice(0, 4);
  }, [sessionsQuery.data, transactionsQuery.data, user?.id]);

  const completedSessions = (sessionsQuery.data ?? []).filter(
    (session) => session.status === "COMPLETED",
  ).length;
  const totalTrackedSessions = Math.max((sessionsQuery.data ?? []).length, 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-text-secondary px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white/95 md:px-8">
        INSTANT SUPPORT: ONLINE | SPEAK TO A CERTIFIED HEALER NOW
      </div>

      <div className="grid w-full grid-cols-1 md:h-[calc(100vh-36px)] md:grid-cols-[300px_1fr] md:overflow-hidden">
        <aside className="hidden border-r border-accent/70 bg-white/88 p-5 md:flex md:h-[calc(100vh-36px)] md:flex-col md:overflow-y-auto">
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-secondary">
              Apna Healer
            </h2>
            <p className="text-xs uppercase tracking-[0.22em] text-text-primary/50">
              Feel Together, Heal Together
            </p>
          </div>

          <div className="mt-8 grid gap-2">
            {sideNavItems.map((item) =>
              item.icon ? (
                <SidebarItem
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ) : null,
            )}
          </div>

          {personalNavItems.length > 0 ? (
            <div className="mt-8">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
                Personal
              </p>
              <div className="mt-3 grid gap-1">
                {personalNavItems.map((item) =>
                  item.icon ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-gentle px-4 py-3 text-sm text-text-primary/65 transition-colors duration-300 ease-(--ease-calm) hover:bg-accent/50"
                    >
                      <SidebarIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  ) : null,
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-auto space-y-5">
            <button
              type="button"
              onClick={() => openBookSession()}
              className="w-full rounded-full bg-text-secondary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-300 ease-(--ease-calm) hover:shadow-soft-hover"
            >
              Book Session
            </button>

            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              className="w-full rounded-full border border-accent/80 bg-white px-5 py-3 text-sm font-semibold text-text-primary/75 transition-colors duration-300 ease-(--ease-calm) hover:bg-accent/40"
            >
              Support ?
            </button>

            <div className="flex items-center justify-between gap-3 rounded-gentle bg-accent/35 px-3 py-2.5 transition-colors duration-300 hover:bg-accent/45">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatarCircle
                  name={user?.name}
                  email={user?.email}
                  image={user?.image}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {sidebarName}
                  </p>
                  <p className="truncate text-xs text-text-primary/60">{sidebarSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignOutOpen(true)}
                className="shrink-0 rounded-full border border-accent/90 bg-white px-3 py-1.5 text-xs font-semibold text-text-primary/70 transition-colors hover:bg-accent/40"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 md:h-[calc(100vh-36px)] md:overflow-y-auto">
          <header className="sticky top-0 z-30 mb-5 border-y border-accent/80 bg-white/80 px-5 py-3 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-6">
              <nav className="flex items-center gap-1 md:gap-2">
                {topNavItems.map((item) => (
                  <NavItem
                    key={item.id}
                    href={item.href}
                    label={item.label}
                  />
                ))}
              </nav>

              <div className="flex items-center gap-3 text-sm text-text-primary/75">
                <label className="flex items-center gap-2 rounded-full border border-accent/80 bg-white px-3 py-2 text-text-primary/60">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search"
                    aria-label="Search dashboard"
                    className="w-32 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/45 md:w-44"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-[#e9e3da] px-4 py-2 font-semibold text-text-primary/85 transition-colors hover:bg-[#dfd7cc]"
                  aria-label="Wallet balance"
                >
                  {walletBalance}
                </button>
                <NotificationBell />

                <Link
                  href="/"
                  className="rounded-full border border-accent/80 bg-white px-4 py-2 font-medium text-text-primary transition-colors hover:bg-accent/35"
                >
                  Go to Homepage
                </Link>
              </div>
            </div>
          </header>

          <main className="px-5 pb-5 md:px-8 md:pb-8">
            <p className="mb-4 text-sm font-medium text-text-primary/55">
              {breadcrumbSegments.join(" > ")}
            </p>
            <div
              className={
                isDashboardHome
                  ? "grid min-h-0 gap-5 xl:grid-cols-[1fr_280px] xl:items-start"
                  : "grid grid-cols-1"
              }
            >
              <div className="min-h-0">{children}</div>

              {isDashboardHome ? (
                <aside className="scrollbar-hide hidden min-h-0 self-start rounded-calm border border-accent/70 bg-white/88 p-5 xl:sticky xl:top-24 xl:block xl:max-h-[min(calc(100vh-7rem),calc(100dvh-7rem))] xl:overflow-y-auto xl:overscroll-y-contain">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                    Recent Activity
                  </p>

                  <div className="mt-6 space-y-5">
                    {transactionsQuery.isLoading || sessionsQuery.isLoading ? (
                      <ActivityFeedSkeleton />
                    ) : recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={activity.id} className="relative pl-5">
                          <span
                            className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                              index === 0 ? "bg-primary" : "bg-primary/70"
                            }`}
                          />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                            {activity.date}
                          </p>
                          <p className="mt-1 text-sm font-medium text-text-primary">
                            {activity.title}
                          </p>
                          <p className="text-xs text-text-primary/60">{activity.detail}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-primary/55">
                        Your recent wallet and session activity will appear here once you start
                        using the platform.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 rounded-[1rem] bg-[#f9f7f2] p-4 ring-1 ring-black/[0.04]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/40">
                      Suggested events
                    </p>
                    <div className="mt-4 space-y-5">
                      {dashboardSuggestedEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...morphTransition, delay: 0.04 + index * 0.06 }}
                        >
                          <Link
                            href={`/dashboard/events/${event.id}`}
                            className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
                          >
                            <div className="relative overflow-hidden rounded-2xl">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={event.image}
                                alt={event.title}
                                className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03]"
                              />
                              <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text-primary/75 shadow-sm">
                                {event.dateBadge}
                              </span>
                            </div>
                            <h3 className="mt-3 text-[15px] font-semibold leading-snug text-text-primary group-hover:text-text-secondary">
                              {event.title}
                            </h3>
                            <p className="mt-1 text-xs font-medium text-text-primary/55">{event.metaLine}</p>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <Link
                      href="/dashboard/events"
                      className="mt-6 flex w-full items-center justify-center rounded-full border border-text-primary/15 bg-transparent py-2.5 text-center text-xs font-semibold text-text-primary/65 transition hover:border-text-primary/25 hover:bg-white/60 hover:text-text-primary"
                    >
                      View all events
                    </Link>
                  </div>

                  <div className="mt-8 rounded-calm bg-text-secondary p-4 text-white shadow-soft transition-shadow duration-500 hover:shadow-[0_12px_40px_-16px_rgb(47_93_80/55%)]">
                    <p className="font-display text-2xl font-semibold">
                      Weekly Goal
                    </p>
                    <p className="mt-2 text-sm text-white/85">
                      {completedSessions}/{totalTrackedSessions} Sessions Completed
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-white/90"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((completedSessions / totalTrackedSessions) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </main>
        </div>
      </div>
      <ListenerAvailabilityChip />
      {isSupportOpen ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="w-full max-w-[420px] rounded-calm bg-white p-6 shadow-[0_20px_64px_-20px_rgb(0_0_0/40%)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-4xl font-semibold text-text-primary">
                <span className="h-6 w-1.5 rounded-full bg-text-secondary" aria-hidden />
                Submit a Report
              </h2>
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="rounded-full p-1.5 text-text-primary/45 hover:bg-accent/45"
                aria-label="Close support modal"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">
              What&apos;s the nature of your report?
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(
                [
                  { id: "technical", label: "Technical" },
                  { id: "safety", label: "Safety" },
                  { id: "billing", label: "Billing" },
                  { id: "other", label: "Other" },
                ] as const
              ).map((type) => {
                const selected = reportType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setReportType(type.id)}
                    className={`rounded-gentle border px-2 py-3 text-center text-xs font-semibold transition-colors ${
                      selected
                        ? "border-text-secondary bg-primary/10 text-text-secondary"
                        : "border-transparent bg-background text-text-primary/70 hover:bg-accent/45"
                    }`}
                  >
                    <span className="mb-1 inline-flex items-center justify-center text-text-secondary/90">
                      {type.id === "technical" ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M10 2v3M14 2v3M5 7h14v12H5z" />
                          <path d="M9 11h6M12 8v6" strokeLinecap="round" />
                        </svg>
                      ) : type.id === "safety" ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 3 5 6v6c0 4 2.8 7.6 7 9 4.2-1.4 7-5 7-9V6l-7-3Z" />
                        </svg>
                      ) : type.id === "billing" ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3" y="7" width="18" height="10" rx="2" />
                          <path d="M7 12h10" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="6" cy="12" r="1.3" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.3" fill="currentColor" />
                          <circle cx="18" cy="12" r="1.3" fill="currentColor" />
                        </svg>
                      )}
                    </span>
                    {type.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-sm font-medium text-text-primary/75">
              Describe the situation
              <textarea
                placeholder="Tell us more about what happened..."
                className="mt-2 min-h-[120px] w-full rounded-gentle border border-accent/80 bg-background px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-primary/35"
              />
            </label>

            <div className="mt-4 flex items-center justify-between rounded-gentle border border-accent/80 bg-background px-4 py-3">
              <p className="text-sm text-text-primary/65">
                <span className="mr-1.5 inline-flex align-middle text-text-secondary/90">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 7v9a3 3 0 0 0 6 0V6a2 2 0 1 0-4 0v9a1 1 0 1 0 2 0V8" strokeLinecap="round" />
                  </svg>
                </span>
                Attach screenshots or logs <span className="text-text-primary/40">(Optional)</span>
              </p>
              <button type="button" className="text-sm font-semibold text-text-secondary hover:text-text-primary">
                Browse
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSupportOpen(false)}
              className="mt-5 w-full rounded-full bg-text-secondary px-6 py-3 text-base font-semibold text-white shadow-sm transition-shadow hover:shadow-soft-hover"
            >
              Send Report
            </button>
          </div>
        </div>
      ) : null}
      <SignOutDialog
        open={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        userLabel={user?.name ?? user?.email ?? null}
        callbackUrl="/"
      />
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SessionDetailsModalProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </SessionDetailsModalProvider>
  );
}
