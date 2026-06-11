"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { getDashboardModules } from "@/config/dashboard-modules";
import { Skeleton } from "@/components/ui/skeleton";
import { displayAccountLabel, toSentenceCase } from "@/lib/display";
import type { ApiUser } from "@/types/api";
import {
  NavItem,
  SidebarIcon,
  SidebarItem,
} from "@/components/dashboard/dashboard-shell";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";
import { SessionDetailsModalProvider } from "@/components/dashboard/session-details-modal";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { RoleThemeProvider } from "@/components/providers/role-theme-provider";

type AdminShellProps = {
  children: ReactNode;
};

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => toTitleCase(segment));

  const currentUserQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const adminUsersQuery = useQuery({
    queryKey: ["admin-shell-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });

  const adminUser = currentUserQuery.data;
  const loadedUsers = useMemo(() => adminUsersQuery.data ?? [], [adminUsersQuery.data]);
  const role = adminUser?.role ?? null;

  const adminTopNavItems = useMemo(
    () => getDashboardModules({ surface: "admin", placement: "top-nav", role }),
    [role],
  );
  const adminSideNavItems = useMemo(
    () =>
      getDashboardModules({
        surface: "admin",
        placement: "sidebar",
        group: "primary",
        role,
      }),
    [role],
  );
  const adminSystemItems = useMemo(
    () =>
      getDashboardModules({
        surface: "admin",
        placement: "sidebar",
        group: "system",
        role,
      }),
    [role],
  );

  return (
    <RoleThemeProvider>
    <SessionDetailsModalProvider>
    <div className="min-h-screen bg-background">
      <div className="bg-theme-banner px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white/95 md:px-8">
        ADMIN CONSOLE · SANCTUARY OPERATIONS
      </div>

      <div className="grid w-full grid-cols-1 md:h-[calc(100vh-36px)] md:grid-cols-[300px_1fr] md:overflow-hidden">
        <aside className="hidden border-r border-accent/70 bg-white/88 p-5 md:flex md:h-[calc(100vh-36px)] md:flex-col md:overflow-y-auto">
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-secondary">
              Apna Healer
            </h2>
            <p className="text-xs uppercase tracking-[0.22em] text-text-primary/50">
              Heal Together Feel Together
            </p>
          </div>

          <div className="mt-8 grid gap-2">
            {adminSideNavItems.map((item) =>
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

          {adminSystemItems.length > 0 ? (
            <div className="mt-8">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
                System
              </p>
              <div className="mt-3 grid gap-1">
                {adminSystemItems.map((item) =>
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
            <Link
              href="/admin/exports"
              className="flex w-full items-center justify-center rounded-full bg-text-secondary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-300 ease-(--ease-calm) hover:shadow-soft-hover"
            >
              Export report
            </Link>

            <div className="flex items-center justify-between gap-3 rounded-gentle bg-accent/35 px-3 py-2.5 transition-colors duration-300 hover:bg-accent/45">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatarCircle
                  name={adminUser?.name}
                  email={adminUser?.email}
                  image={adminUser?.image}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {adminUser
                      ? displayAccountLabel(adminUser.name, adminUser.email)
                      : currentUserQuery.isLoading
                        ? <Skeleton className="inline-block h-4 w-28" />
                        : "Member"}
                  </p>
                  <p className="truncate text-xs text-text-primary/60">
                    {adminUser ? toSentenceCase(adminUser.role) : "Loading access"}
                  </p>
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
                {adminTopNavItems.map((item) => (
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
                    placeholder="Search platform"
                    aria-label="Search admin"
                    className="w-32 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/45 md:w-44"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-[#e9e3da] px-4 py-2 font-semibold text-text-primary/85 transition-colors hover:bg-[#dfd7cc]"
                  aria-label="Platform volume"
                >
                  {loadedUsers.length} Users
                </button>
                <NotificationBell panelTitle="Platform alerts" />

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
            <div className="grid grid-cols-1">{children}</div>
          </main>
        </div>
      </div>
      <SignOutDialog
        open={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        userLabel={adminUser ? displayAccountLabel(adminUser.name, adminUser.email) : null}
        callbackUrl="/"
      />
    </div>
    </SessionDetailsModalProvider>
    </RoleThemeProvider>
  );
}
