"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookSessionModalProvider,
  useBookSessionModal,
} from "./book-session-modal";
import { ListenerAvailabilityChip } from "./listener-availability-chip";

type DashboardShellProps = {
  children: ReactNode;
};

const topNavItems = [
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/clubs", label: "Clubs" },
  { href: "/dashboard/therapists", label: "Therapists" },
];

const sideNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/dashboard/blog", label: "Blogs", icon: "blog" as const },
  { href: "/dashboard/journal", label: "Journal", icon: "journal" as const },
  {
    href: "/dashboard/safe-circle",
    label: "Safe Circle",
    icon: "circle" as const,
  },
];

const personalNavItems = [
  { href: "/dashboard/profile", label: "Profile", icon: "profile" as const },
  { href: "/dashboard/wallet", label: "Wallet", icon: "currency" as const },
  { href: "/dashboard/packages", label: "Packages", icon: "packages" as const },
];

function SidebarIcon({
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

function NavItem({ href, label }: { href: string; label: string }) {
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

function SidebarItem({
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

function DashboardShellContent({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { open: openBookSession } = useBookSessionModal();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("safety");
  const notificationContainerRef = useRef<HTMLDivElement | null>(null);
  const isDashboardHome = pathname === "/dashboard";
  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => toTitleCase(segment));

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationOpen]);

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
            {sideNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>

          <div className="mt-8">
            <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
              Personal
            </p>
            <div className="mt-3 grid gap-1">
              {personalNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-gentle px-4 py-3 text-sm text-text-primary/65 transition-colors duration-300 ease-(--ease-calm) hover:bg-accent/50"
                >
                  <SidebarIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-text-secondary text-xs font-semibold text-white">
                  MV
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    Maya Verma
                  </p>
                  <p className="truncate text-xs text-text-primary/60">Premium Member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/auth/signout";
                }}
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
                    key={item.href}
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
                  ₹ 2,450
                </button>
                <div className="relative" ref={notificationContainerRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    className={`rounded-full border bg-white p-2 text-text-primary/70 transition-colors ${
                      isNotificationOpen
                        ? "border-primary/35 bg-primary/10"
                        : "border-accent/80 hover:bg-accent/45"
                    }`}
                    aria-label="Notifications"
                    aria-expanded={isNotificationOpen}
                    aria-haspopup="dialog"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M6 9a6 6 0 1 1 12 0v4l1.5 2h-15L6 13V9Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
                    </svg>
                  </button>

                  {isNotificationOpen ? (
                    <div
                      role="dialog"
                      aria-label="Notifications"
                      className="absolute right-0 top-[calc(100%+0.65rem)] z-40 w-[340px] rounded-calm border border-accent/80 bg-white p-4 shadow-[0_16px_40px_-20px_rgb(0_0_0/35%)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                        Notifications
                      </p>

                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                          Recent
                        </p>
                        <div className="mt-2 space-y-2.5">
                          <div className="rounded-gentle bg-primary/10 px-3 py-2.5">
                            <p className="text-sm font-semibold text-text-primary">
                              New reflection in Quiet Waters
                            </p>
                            <p className="mt-0.5 text-xs text-text-primary/55">
                              Elena Vance posted 8 mins ago
                            </p>
                          </div>
                          <div className="rounded-gentle bg-background px-3 py-2.5">
                            <p className="text-sm font-semibold text-text-primary">
                              3 members supported your post
                            </p>
                            <p className="mt-0.5 text-xs text-text-primary/55">
                              Marcus, Liam and Sarah reacted
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-accent/80 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                          Older
                        </p>
                        <div className="mt-2 space-y-2.5">
                          <div className="rounded-gentle bg-background px-3 py-2.5">
                            <p className="text-sm font-semibold text-text-primary">
                              Circle reminder: evening check-in starts soon
                            </p>
                            <p className="mt-0.5 text-xs text-text-primary/55">
                              Yesterday, 8:20 PM
                            </p>
                          </div>
                          <div className="rounded-gentle bg-background px-3 py-2.5">
                            <p className="text-sm font-semibold text-text-primary">
                              Community guideline update
                            </p>
                            <p className="mt-0.5 text-xs text-text-primary/55">
                              2 days ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

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
                  ? "grid gap-5 xl:grid-cols-[1fr_280px]"
                  : "grid grid-cols-1"
              }
            >
              <div className="">{children}</div>

              {isDashboardHome ? (
                <aside className="hidden rounded-calm border border-accent/70 bg-white/88 p-5 xl:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                    Recent Activity
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="relative pl-5">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                        Yesterday
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        Completed &quot;Emotional Regulation&quot; module
                      </p>
                      <p className="text-xs text-text-primary/60">
                        Earned +50 Growth Points
                      </p>
                    </div>

                    <div className="relative pl-5">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary/70" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                        Oct 21, 11:40 AM
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        Wallet topped up
                      </p>
                      <p className="text-xs font-semibold text-text-secondary">
                        + 2,000.00
                      </p>
                    </div>

                    <div className="relative pl-5">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                        Oct 20, 09:15 PM
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        Spoke with Listener Sarah J.
                      </p>
                      <p className="text-xs text-text-primary/60">
                        Duration: 45 mins
                      </p>
                    </div>

                    <div className="relative pl-5">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary/70" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">
                        Oct 19, 04:00 PM
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        Left a review for Dr. Thorne
                      </p>
                      <p className="text-xs text-text-secondary">5.0 stars</p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-calm bg-text-secondary p-4 text-white shadow-soft transition-shadow duration-500 hover:shadow-[0_12px_40px_-16px_rgb(47_93_80/55%)]">
                    <p className="font-display text-2xl font-semibold">
                      Weekly Goal
                    </p>
                    <p className="mt-2 text-sm text-white/85">
                      3/5 Sessions Completed
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-white/25">
                      <div className="h-full w-3/5 rounded-full bg-white/90" />
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
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <BookSessionModalProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </BookSessionModalProvider>
  );
}
