import type { UserRole } from "@/types/api";

export type DashboardSurface = "dashboard" | "admin";
export type DashboardPlacement = "sidebar" | "top-nav";
export type DashboardGroup = "primary" | "personal" | "system";
export type DashboardIcon =
  | "reports"
  | "profile"
  | "settings"
  | "plans"
  | "packages"
  | "currency"
  | "dashboard"
  | "blog"
  | "journal"
  | "circle"
  | "social";

export type DashboardModule = {
  id: string;
  href: string;
  label: string;
  surface: DashboardSurface;
  placement: DashboardPlacement;
  group?: DashboardGroup;
  icon?: DashboardIcon;
  roles: readonly UserRole[];
};

const MEMBER_ROLES: readonly UserRole[] = ["USER", "THERAPIST", "LISTENER"] as const;
const LISTENER_ROLES: readonly UserRole[] = ["LISTENER"] as const;
const THERAPIST_ROLES: readonly UserRole[] = ["THERAPIST"] as const;
const ADMIN_ROLES: readonly UserRole[] = ["ADMIN"] as const;
const CONSUMER_ROLES: readonly UserRole[] = ["USER"] as const;
const PROVIDER_ROLES: readonly UserRole[] = ["THERAPIST", "LISTENER"] as const;

export const dashboardModules: readonly DashboardModule[] = [
  // Member surface — top nav
  {
    id: "dashboard.top.events",
    href: "/dashboard/events",
    label: "Events",
    surface: "dashboard",
    placement: "top-nav",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.top.clubs",
    href: "/dashboard/clubs",
    label: "Clubs",
    surface: "dashboard",
    placement: "top-nav",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.top.therapists",
    href: "/dashboard/therapists",
    label: "Therapists",
    surface: "dashboard",
    placement: "top-nav",
    roles: MEMBER_ROLES,
  },

  // Member surface — primary sidebar
  {
    id: "dashboard.side.home",
    href: "/dashboard",
    label: "Dashboard",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "dashboard",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.side.blog",
    href: "/dashboard/blog",
    label: "Blogs",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "blog",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.side.journal",
    href: "/dashboard/journal",
    label: "Journal",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "journal",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.side.safe-circle",
    href: "/dashboard/safe-circle",
    label: "Safe Circle",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "circle",
    roles: MEMBER_ROLES,
  },

  // USER: My Sessions
  {
    id: "dashboard.side.my-sessions",
    href: "/dashboard/my-sessions",
    label: "My Sessions",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "plans",
    roles: CONSUMER_ROLES,
  },

  // THERAPIST: Patients, Consultations & Analytics
  {
    id: "dashboard.side.patients",
    href: "/dashboard/patients",
    label: "Patients",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "circle",
    roles: THERAPIST_ROLES,
  },
  {
    id: "dashboard.side.consultations",
    href: "/dashboard/consultations",
    label: "Consultations",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "plans",
    roles: THERAPIST_ROLES,
  },
  {
    id: "dashboard.side.analytics",
    href: "/dashboard/analytics",
    label: "Analytics",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "reports",
    roles: THERAPIST_ROLES,
  },

  // LISTENER: Support Requests, Impact & Training Center
  {
    id: "dashboard.side.support-requests",
    href: "/dashboard/support-requests",
    label: "Support Requests",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "reports",
    roles: LISTENER_ROLES,
  },
  {
    id: "dashboard.side.impact",
    href: "/dashboard/impact",
    label: "Impact",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "social",
    roles: LISTENER_ROLES,
  },
  {
    id: "dashboard.side.listener-inbox",
    href: "/dashboard/listener-inbox",
    label: "Sessions",
    surface: "dashboard",
    placement: "sidebar",
    group: "primary",
    icon: "plans",
    roles: LISTENER_ROLES,
  },

  // Member surface — personal sidebar
  {
    id: "dashboard.personal.profile",
    href: "/dashboard/profile",
    label: "Profile",
    surface: "dashboard",
    placement: "sidebar",
    group: "personal",
    icon: "profile",
    roles: MEMBER_ROLES,
  },
  {
    id: "dashboard.personal.wallet",
    href: "/dashboard/wallet",
    label: "Wallet",
    surface: "dashboard",
    placement: "sidebar",
    group: "personal",
    icon: "currency",
    roles: CONSUMER_ROLES,
  },
  {
    id: "dashboard.personal.packages",
    href: "/dashboard/packages",
    label: "Packages",
    surface: "dashboard",
    placement: "sidebar",
    group: "personal",
    icon: "packages",
    roles: ["USER", "THERAPIST"] as const,
  },
  {
    id: "dashboard.personal.earnings",
    href: "/dashboard/earnings",
    label: "Earnings",
    surface: "dashboard",
    placement: "sidebar",
    group: "personal",
    icon: "currency",
    roles: PROVIDER_ROLES,
  },
  {
    id: "dashboard.personal.library",
    href: "/dashboard/library",
    label: "Library",
    surface: "dashboard",
    placement: "sidebar",
    group: "personal",
    icon: "blog",
    roles: MEMBER_ROLES,
  },

  // Admin surface — top nav
  {
    id: "admin.top.sessions",
    href: "/admin/sessions",
    label: "Sessions",
    surface: "admin",
    placement: "top-nav",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.top.communities",
    href: "/admin/communities",
    label: "Communities",
    surface: "admin",
    placement: "top-nav",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.top.clubs",
    href: "/admin/clubs",
    label: "Clubs",
    surface: "admin",
    placement: "top-nav",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.top.events",
    href: "/admin/events",
    label: "Events",
    surface: "admin",
    placement: "top-nav",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.top.healers",
    href: "/admin/healers",
    label: "Healers",
    surface: "admin",
    placement: "top-nav",
    roles: ADMIN_ROLES,
  },

  // Admin surface — primary sidebar
  {
    id: "admin.side.overview",
    href: "/admin",
    label: "Overview",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "dashboard",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.applications",
    href: "/admin/applications",
    label: "Applications",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "reports",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.listener-requests",
    href: "/admin/listener-requests",
    label: "Listener Queue",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "circle",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.moderation",
    href: "/admin/moderation",
    label: "Moderation",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "blog",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.blogs",
    href: "/admin/blogs",
    label: "Blogs",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "blog",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.users",
    href: "/admin/users",
    label: "Users",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "circle",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.side.packages",
    href: "/admin/packages",
    label: "Packages",
    surface: "admin",
    placement: "sidebar",
    group: "primary",
    icon: "packages",
    roles: ADMIN_ROLES,
  },

  // Admin surface — system sidebar
  {
    id: "admin.system.audit",
    href: "/admin/audit",
    label: "Audit log",
    surface: "admin",
    placement: "sidebar",
    group: "system",
    icon: "journal",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.system.settings",
    href: "/admin/settings",
    label: "Settings",
    surface: "admin",
    placement: "sidebar",
    group: "system",
    icon: "settings",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.system.themes",
    href: "/admin/settings/themes",
    label: "Theme Management",
    surface: "admin",
    placement: "sidebar",
    group: "system",
    icon: "settings",
    roles: ADMIN_ROLES,
  },
  {
    id: "admin.system.finance",
    href: "/admin/finance",
    label: "Finance",
    surface: "admin",
    placement: "sidebar",
    group: "system",
    icon: "currency",
    roles: ADMIN_ROLES,
  },
];

export type ModuleFilter = {
  surface: DashboardSurface;
  placement: DashboardPlacement;
  group?: DashboardGroup;
  role?: UserRole | null;
};

export type DashboardSidebarMenu = {
  id: string;
  label: string;
  icon: DashboardIcon;
  childModuleIds: readonly string[];
};

/** Sidebar dropdown groups — child modules stay in `dashboardModules` for access control. */
export const dashboardSidebarMenus: readonly DashboardSidebarMenu[] = [
  {
    id: "social",
    label: "Social",
    icon: "social",
    childModuleIds: [
      "dashboard.side.blog",
      "dashboard.side.journal",
      "dashboard.side.safe-circle",
    ],
  },
];

const sidebarMenuChildIds = new Set(
  dashboardSidebarMenus.flatMap((menu) => menu.childModuleIds),
);

export function isSidebarMenuChild(moduleId: string) {
  return sidebarMenuChildIds.has(moduleId);
}

export function getDashboardModules(filter: ModuleFilter): DashboardModule[] {
  return dashboardModules.filter((module) => {
    if (module.surface !== filter.surface) return false;
    if (module.placement !== filter.placement) return false;
    if (filter.group !== undefined && module.group !== filter.group) return false;
    if (filter.role) {
      if (filter.role === "ADMIN" && filter.surface === "dashboard") {
        return true;
      }
      if (!module.roles.includes(filter.role)) return false;
    }
    return true;
  });
}

export function canAccessSurface(role: UserRole | null | undefined, surface: DashboardSurface) {
  if (!role) return false;
  if (surface === "admin") return role === "ADMIN";
  return role === "USER" || role === "THERAPIST" || role === "LISTENER" || role === "ADMIN";
}
