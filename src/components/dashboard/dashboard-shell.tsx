"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, Fragment, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheckIcon,
  HeadphonesIcon,
  HomeIcon,
  MenuIcon,
  UserRoundIcon,
  XIcon,
  CalendarPlusIcon,
  LifeBuoyIcon,
  LogOutIcon,
  WalletIcon,
  BellIcon,
  HouseIcon,
  SearchIcon,
  ChevronRightIcon,
  SproutIcon,
  BookOpenIcon,
  NotebookPenIcon,
  UsersRoundIcon,
  FeatherIcon,
  CoinsIcon,
  PhoneCallIcon,
  UsersIcon,
  CalendarDaysIcon,
} from "lucide-react";
import { ActivityFeedSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api-client";
import {
  dashboardSidebarMenus,
  getDashboardModules,
  isSidebarMenuChild,
  type DashboardModule,
} from "@/config/dashboard-modules";
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
import {
  useListenerSupportModal,
} from "./listener-support-modal";
import { ListenerAvailabilityChip } from "./listener-availability-chip";
import { SessionDetailsModalProvider } from "./session-details-modal";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { dashboardSuggestedEvents } from "@/data/events";
import { morphTransition } from "@/components/ui/fade-in";
import { RoleThemeProvider } from "@/components/providers/role-theme-provider";
import { useThemePalette } from "@/hooks/use-theme-palette";

type DashboardShellProps = {
  children: ReactNode;
};

export function SidebarIcon({
  icon,
}: {
  icon: string;
}) {
  if (icon === "dashboard") return <HomeIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "blog") return <BookOpenIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "journal") return <NotebookPenIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "circle") return <UsersRoundIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "plans") return <CalendarCheckIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "profile") return <UserRoundIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "currency") return <WalletIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "packages") return <CoinsIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "reports") return <FeatherIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "social") return <UsersRoundIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  if (icon === "settings") return <LifeBuoyIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  return <HomeIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-forest-500 ring-1 ring-sage-200">
        <SproutIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-[17px] font-bold leading-tight text-forest-600">
          Apna Healer
        </span>
        {!compact && (
          <span className="block truncate text-[11px] italic tracking-wide text-charcoal-400">
            Feel Together, Heal Together
          </span>
        )}
      </span>
    </div>
  );
}

export function SupportBar({ onContactListener }: { onContactListener?: () => void }) {
  const { forest: FOREST } = useThemePalette();
  return (
    <div className="w-full bg-forest-600 text-cream-100" style={{ backgroundColor: FOREST }}>
      <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-center gap-2.5 px-4 text-[11px] font-medium uppercase tracking-[0.14em]">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-300 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-300" />
        </span>
        <span className="truncate">
          Instant support: online
          <span className="mx-2 text-sage-300/70">·</span>
          <button
            type="button"
            onClick={onContactListener}
            className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors duration-150 ease-out hover:text-white hover:underline cursor-pointer"
          >
            <PhoneCallIcon className="h-3 w-3" aria-hidden="true" />
            Speak to a certified healer now
          </button>
        </span>
      </div>
    </div>
  );
}

interface NavSectionProps {
  label?: string;
  items: DashboardModule[];
  onNavigate?: () => void;
}

export function NavSection({ label, items, onNavigate }: NavSectionProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-text opacity-60">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ease-out ${isActive
                  ? "bg-sidebar-active-bg font-semibold text-sidebar-active-text"
                  : "text-sidebar-text hover:bg-sidebar-active-bg/25 hover:text-sidebar-active-text"
                  }`}
              >
                <span
                  className={`transition-colors duration-150 ease-out ${isActive ? "text-sidebar-active-text" : "text-sidebar-text opacity-85 group-hover:text-sidebar-active-text"
                    }`}
                >
                  <SidebarIcon icon={item.icon ?? "dashboard"} />
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-active-text" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-soft px-3 py-2 text-sm font-medium transition-colors duration-300 ease-(--ease-calm) ${isActive
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
  icon: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-gentle px-4 py-3 text-sm transition-colors duration-300 ease-(--ease-calm) ${isActive
        ? "bg-sidebar-active-bg font-semibold text-sidebar-active-text"
        : "text-sidebar-text hover:bg-sidebar-active-bg/25 hover:text-sidebar-active-text"
        }`}
    >
      <span className="flex items-center gap-3">
        <SidebarIcon icon={icon} />
        {label}
      </span>
      {isActive ? (
        <span className="h-6 w-1 rounded-full bg-sidebar-active-text" aria-hidden />
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

function Sidebar({
  role,
  user,
  sidebarName,
  sidebarSubtitle,
  overviewItems,
  roleItems,
  socialItems,
  personalItems,
  onNavigate,
  openBookSession,
  setIsSupportOpen,
  setIsSignOutOpen,
}: {
  role: string | null;
  user: ApiUser | undefined;
  sidebarName: string;
  sidebarSubtitle: string;
  overviewItems: DashboardModule[];
  roleItems: DashboardModule[];
  socialItems: DashboardModule[];
  personalItems: DashboardModule[];
  onNavigate?: () => void;
  openBookSession: () => void;
  setIsSupportOpen: (open: boolean) => void;
  setIsSignOutOpen: (open: boolean) => void;
}) {
  const roleLabel = useMemo(() => {
    if (role === "USER") return "My Care";
    if (role === "THERAPIST") return "Practice";
    if (role === "LISTENER") return "Listening";
    return undefined;
  }, [role]);

  return (
    <div className="flex h-full flex-col bg-sidebar-bg text-sidebar-text">
      <div className="px-5 pb-4 pt-5 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0">
          <img
            src="/logo.svg"
            alt=""
            width={84}
            height={80}
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: "var(--theme-sidebar-active-text)" }}>
            Apna Healer
          </h2>
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-80" style={{ color: "var(--theme-sidebar-text)" }}>
            Feel Together, Heal Together
          </p>
        </div>
      </div>

      <nav
        aria-label="Main"
        className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-2 pb-4"
      >
        <NavSection items={overviewItems} onNavigate={onNavigate} />
        {socialItems.length > 0 && (
          <NavSection label="Social" items={socialItems} onNavigate={onNavigate} />
        )}
        {roleItems.length > 0 && roleLabel && (
          <NavSection label={roleLabel} items={roleItems} onNavigate={onNavigate} />
        )}
        {personalItems.length > 0 && (
          <NavSection label="Personal" items={personalItems} onNavigate={onNavigate} />
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="space-y-3 border-t border-sidebar-active-bg/50 px-4 py-4">
        {role === "USER" && (
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              openBookSession();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-text-secondary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-text-secondary/95 active:scale-[0.98] cursor-pointer"
          >
            <CalendarPlusIcon className="h-4 w-4" aria-hidden="true" />
            Book Session
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            setIsSupportOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-text/25 bg-transparent px-3 py-2 text-sm text-sidebar-text transition-colors duration-150 ease-out hover:bg-sidebar-active-bg/30 cursor-pointer font-medium"
        >
          <LifeBuoyIcon className="h-4 w-4" aria-hidden="true" />
          Support
        </button>

        <div className="flex items-center gap-2.5 rounded-2xl bg-sidebar-active-bg/30 p-2 border border-sidebar-active-bg/25">
          <UserAvatarCircle
            name={user?.name}
            email={user?.email}
            image={user?.image}
            className="h-9 w-9 ring-1 ring-sidebar-active-bg/35"
            fallbackClassName="bg-text-secondary text-xs text-white"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-active-text">{sidebarName}</p>
            <p className="truncate text-[11px] text-sidebar-text opacity-75">{sidebarSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              setIsSignOutOpen(true);
            }}
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-sidebar-text transition-colors duration-150 ease-out hover:bg-sidebar-active-bg hover:text-sidebar-active-text cursor-pointer shrink-0"
          >
            <LogOutIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileTabBar({
  role,
  onOpenMore,
  onSupportClick,
}: {
  role: string | null;
  onOpenMore: () => void;
  onSupportClick: () => void;
}) {
  const pathname = usePathname();
  const { open: openListenerModal } = useListenerSupportModal();

  const sessionsHref = useMemo(() => {
    if (role === "THERAPIST") return "/dashboard/consultations";
    if (role === "LISTENER") return "/dashboard/listener-inbox";
    return "/dashboard/my-sessions";
  }, [role]);

  return (
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="pb-safe border-t border-cream-300/70 bg-[#faf9f5]/90 shadow-[0_-10px_35px_-15px_rgba(85,118,76,0.3)] backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch px-2">

          {/* Tab 1: Home */}
          <Link
            href="/dashboard"
            className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname === "/dashboard" ? "text-[#55764c]" : "text-text-primary/60"
              }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span>Home</span>
            <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname === "/dashboard" ? "bg-[#55764c]" : "bg-transparent"}`} />
          </Link>

          {/* Tab 2: Sessions */}
          <Link
            href={sessionsHref}
            className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname.startsWith(sessionsHref) ? "text-[#55764c]" : "text-text-primary/60"
              }`}
          >
            <CalendarCheckIcon className="h-5 w-5" />
            <span>Sessions</span>
            <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname.startsWith(sessionsHref) ? "bg-[#55764c]" : "bg-transparent"}`} />
          </Link>

          {/* Tab 3: Talk to Listener (FAB in Center) */}
          <div className="relative flex items-end justify-center">
            <motion.button
              type="button"
              onClick={openListenerModal}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              aria-label="Talk to a Listener"
              className="absolute -top-6 flex flex-col items-center "
            >
              <span className="flex h-13 w-13 items-center justify-center rounded-full">
                <img
                  src="/logo.svg"
                  alt=""
                  className=" object-contain"
                  draggable={false}
                />
              </span>
              <span className="mt-1 text-[10px] font-bold text-[#55764c]">Listener</span>
            </motion.button>
          </div>

          {/* Tab 4: Profile */}
          <Link
            href="/dashboard/profile"
            className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname.startsWith("/dashboard/profile") ? "text-[#55764c]" : "text-text-primary/60"
              }`}
          >
            <UserRoundIcon className="h-5 w-5" />
            <span>Profile</span>
            <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname.startsWith("/dashboard/profile") ? "bg-[#55764c]" : "bg-transparent"}`} />
          </Link>

          {/* Tab 5: Menu */}
          <button
            type="button"
            onClick={onOpenMore}
            className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold text-text-primary/60 transition-colors hover:text-[#55764c] cursor-pointer"
          >
            <MenuIcon className="h-5 w-5" />
            <span>Menu</span>
            <span className="h-1.5 w-1.5 rounded-full mt-0.5 bg-transparent" />
          </button>

        </div>
      </div>
    </nav>
  );
}

function MobileNavDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-[#425d3b]/25 backdrop-blur-[2px]"
          />
          {/* Drawer content */}
          <motion.div
            role="dialog"
            aria-label="Navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col border-r border-sidebar-active-bg/30 bg-sidebar-bg text-sidebar-text shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-sidebar-text opacity-70 transition-colors duration-150 ease-out hover:bg-sidebar-active-bg/40 hover:text-sidebar-active-text cursor-pointer"
            >
              <XIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex h-full flex-col overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
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
  const sidebarMenus = useMemo(() => {
    const moduleById = new Map(sideNavItems.map((item) => [item.id, item]));
    return dashboardSidebarMenus
      .map((menu) => ({
        ...menu,
        items: menu.childModuleIds
          .map((id) => moduleById.get(id))
          .filter((item): item is DashboardModule => Boolean(item?.icon)),
      }))
      .filter((menu) => menu.items.length > 0);
  }, [sideNavItems]);
  const standaloneSideNavItems = useMemo(
    () => sideNavItems.filter((item) => !isSidebarMenuChild(item.id)),
    [sideNavItems],
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

  const overviewItems = useMemo(
    () => standaloneSideNavItems.filter((item) => item.id === "dashboard.side.home"),
    [standaloneSideNavItems],
  );
  const roleItems = useMemo(
    () => standaloneSideNavItems.filter((item) => item.id !== "dashboard.side.home"),
    [standaloneSideNavItems],
  );
  const socialItems = useMemo(
    () => sidebarMenus.find((menu) => menu.id === "social")?.items ?? [],
    [sidebarMenus],
  );

  const [navOpen, setNavOpen] = useState(false);
  const { open: openListenerSupport } = useListenerSupportModal();

  const sidebarContent = (
    <Sidebar
      role={role}
      user={user}
      sidebarName={sidebarName}
      sidebarSubtitle={sidebarSubtitle}
      overviewItems={overviewItems}
      roleItems={roleItems}
      socialItems={socialItems}
      personalItems={personalNavItems}
      openBookSession={openBookSession}
      setIsSupportOpen={setIsSupportOpen}
      setIsSignOutOpen={setIsSignOutOpen}
    />
  );

  const percent = Math.min(
    100,
    Math.round((completedSessions / totalTrackedSessions) * 100),
  );

  return (
    <div className="min-h-screen w-full bg-[#fdfcf9] font-sans text-charcoal-700">
      <SupportBar onContactListener={role === "USER" ? openListenerSupport : undefined} />
      <div className="grid w-full grid-cols-1 lg:h-[calc(100vh-36px)] lg:grid-cols-[288px_1fr] lg:overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-cream-200 bg-sidebar-bg text-sidebar-text lg:flex lg:h-[calc(100vh-36px)] lg:flex-col lg:overflow-y-auto shrink-0">
          {sidebarContent}
        </aside>

        <div className="min-w-0 flex-1 lg:h-[calc(100vh-36px)] lg:overflow-y-auto">
          {/* WorkspaceHeader */}
          <header className="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
                className="rounded-xl border border-cream-200 bg-white/70 p-2 text-charcoal-500 transition-colors duration-150 ease-out hover:text-[#55764c] lg:hidden cursor-pointer"
              >
                <MenuIcon className="h-4 w-4" aria-hidden="true" />
              </button>

              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-1.5 text-sm">
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-charcoal-400 transition-colors duration-150 ease-out hover:text-[#55764c]"
                    >
                      Home
                    </Link>
                  </li>
                  {breadcrumbSegments.length === 0 ? (
                    <>
                      <ChevronRightIcon className="h-3.5 w-3.5 text-charcoal-400/60" aria-hidden="true" />
                      <li className="font-medium text-[#55764c]" aria-current="page">
                        Dashboard
                      </li>
                    </>
                  ) : (
                    breadcrumbSegments.map((segment, index) => (
                      <Fragment key={segment}>
                        <ChevronRightIcon className="h-3.5 w-3.5 text-charcoal-400/60" aria-hidden="true" />
                        <li
                          className={
                            index === breadcrumbSegments.length - 1
                              ? "truncate font-medium text-[#55764c]"
                              : "truncate text-charcoal-400"
                          }
                          aria-current={index === breadcrumbSegments.length - 1 ? "page" : undefined}
                        >
                          {segment}
                        </li>
                      </Fragment>
                    ))
                  )}
                </ol>
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <nav aria-label="Quick links" className="hidden items-center gap-1 xl:flex">
                  {topNavItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-charcoal-500 transition-colors duration-150 ease-out hover:bg-cream-100 hover:text-[#55764c]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <span className="mx-1 h-5 w-px bg-cream-200" aria-hidden="true" />
                </nav>

                <label className="relative hidden md:block">
                  <span className="sr-only">Search Apna Healer</span>
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder="Search"
                    className="h-9 w-44 rounded-xl border border-cream-200 bg-white/70 pl-9 pr-3 text-sm text-charcoal-700 placeholder:text-charcoal-400 transition-[width,border-color] duration-200 ease-out focus:w-56 focus:border-sage-300 focus:outline-none lg:w-52 lg:focus:w-64"
                  />
                </label>

                <span className="hidden items-center gap-1.5 rounded-xl border border-sage-200 bg-sage-50 px-2.5 py-1.5 text-sm font-medium text-[#55764c] sm:inline-flex">
                  <WalletIcon className="h-4 w-4 text-sage-600" aria-hidden="true" />
                  {walletBalance}
                </span>

                <NotificationBell />

                <Link
                  href="/"
                  aria-label="Go to homepage"
                  className="hidden rounded-xl border border-cream-200 bg-white/70 p-2 text-charcoal-500 transition-colors duration-150 ease-out hover:text-[#55764c] sm:block"
                >
                  <HouseIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </header>

          {/* Main workspace */}
          <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
            <div
              className={
                isDashboardHome
                  ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
                  : "grid grid-cols-1"
              }
            >
              <div className="min-w-0">{children}</div>

              {isDashboardHome && (
                <aside className="space-y-6 lg:pt-1">
                  {/* Recent Activity */}
                  <section aria-labelledby="activity-heading">
                    <h2 id="activity-heading" className="px-1 font-display text-[17px] text-[#55764c] font-bold">
                      Recent Activity
                    </h2>
                    <div className="mt-3 space-y-3 bg-white/70 border border-cream-200 rounded-2xl p-4">
                      {transactionsQuery.isLoading || sessionsQuery.isLoading ? (
                        <ActivityFeedSkeleton />
                      ) : recentActivity.length > 0 ? (
                        <ul className="space-y-3">
                          {recentActivity.map((activity, index) => {
                            const isTxn = activity.id.startsWith("txn-");
                            const dotColor = index === 0 ? "bg-sage-500" : isTxn ? "bg-peach-300" : "bg-lavender-400";
                            return (
                              <li key={activity.id} className="flex gap-3 px-1">
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="text-[13.5px] font-semibold text-charcoal-700">{activity.title}</p>
                                  <p className="truncate text-[13px] text-charcoal-500">{activity.detail}</p>
                                  <p className="mt-0.5 text-[11px] text-charcoal-400">{activity.date}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-charcoal-500 px-1">
                          Your recent wallet and session activity will appear here once you start using the platform.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* Suggested Events */}
                  <section aria-labelledby="events-heading">
                    <div className="flex items-center justify-between px-1">
                      <h2 id="events-heading" className="font-display text-[17px] text-[#55764c] font-bold">
                        Suggested Events
                      </h2>
                      <Link
                        href="/dashboard/events"
                        className="inline-flex items-center gap-1 text-[12px] text-charcoal-400 transition-colors duration-150 ease-out hover:text-[#55764c]"
                      >
                        All
                      </Link>
                    </div>
                    <ul className="mt-3 space-y-2.5">
                      {dashboardSuggestedEvents.map((event, index) => {
                        const toneClass = index % 3 === 0
                          ? "bg-sage-50 border-sage-200/70 text-[#55764c]"
                          : index % 3 === 1
                            ? "bg-lavender-50 border-lavender-200/70 text-lavender-700"
                            : "bg-[#fdf6f1] border-peach-200/70 text-[#b25f3c]";
                        return (
                          <li key={event.id}>
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className={`block rounded-2xl border px-4 py-3 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
                            >
                              <p className="text-[14px] font-semibold font-bold">{event.title}</p>
                              <p className="text-[12.5px] opacity-80">{event.metaLine}</p>
                              <p className="mt-1.5 text-[12px] opacity-60">
                                {event.dateBadge}
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {/* Weekly Goal */}
                  <section
                    aria-labelledby="goal-heading"
                    className="rounded-2xl border border-cream-200 bg-white/70 px-4 py-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 id="goal-heading" className="font-display text-[17px] text-[#55764c] font-bold">
                        Weekly Goal
                      </h2>
                      <span className="text-[12px] text-charcoal-400 font-semibold">
                        {completedSessions} of {totalTrackedSessions}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-charcoal-500">Sessions Completed</p>
                    <div
                      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream-200"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-labelledby="goal-heading"
                    >
                      <div
                        className="h-full rounded-full bg-sage-400 transition-[width] duration-300 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </section>
                </aside>
              )}
            </div>
          </main>
        </div>
      </div>

      <MobileTabBar
        role={role}
        onOpenMore={() => setNavOpen(true)}
        onSupportClick={() => setIsSupportOpen(true)}
      />

      <MobileNavDrawer isOpen={navOpen} onClose={() => setNavOpen(false)}>
        {sidebarContent}
      </MobileNavDrawer>

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
                    className={`rounded-gentle border px-2 py-3 text-center text-xs font-semibold transition-colors ${selected
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
    <RoleThemeProvider>
      <SessionDetailsModalProvider>
        <DashboardShellContent>{children}</DashboardShellContent>
      </SessionDetailsModalProvider>
    </RoleThemeProvider>
  );
}
