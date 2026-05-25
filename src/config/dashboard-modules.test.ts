import { describe, expect, it } from "vitest";
import {
  canAccessSurface,
  dashboardModules,
  getDashboardModules,
} from "@/config/dashboard-modules";

describe("dashboard module registry", () => {
  it("scopes admin surface modules to ADMIN role", () => {
    const adminSideNav = getDashboardModules({
      surface: "admin",
      placement: "sidebar",
      group: "primary",
      role: "ADMIN",
    });
    const userSideNav = getDashboardModules({
      surface: "admin",
      placement: "sidebar",
      group: "primary",
      role: "USER",
    });

    expect(adminSideNav.length).toBeGreaterThan(0);
    expect(userSideNav).toEqual([]);
  });

  it("returns member sidebar modules for member roles", () => {
    const userPrimary = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "primary",
      role: "USER",
    });

    expect(userPrimary.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/blog",
      "/dashboard/journal",
      "/dashboard/safe-circle",
    ]);
  });

  it("treats THERAPIST and LISTENER as members for the dashboard surface", () => {
    const therapistView = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "personal",
      role: "THERAPIST",
    });
    const listenerView = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "personal",
      role: "LISTENER",
    });

    expect(therapistView.length).toBeGreaterThan(0);
    expect(listenerView).toEqual(therapistView);
  });

  it("lets ADMIN see member modules so one identity can use both surfaces", () => {
    const adminMemberView = getDashboardModules({
      surface: "dashboard",
      placement: "top-nav",
      role: "ADMIN",
    });

    expect(adminMemberView.length).toBeGreaterThan(0);
  });

  it("filters strictly by placement", () => {
    const top = getDashboardModules({
      surface: "dashboard",
      placement: "top-nav",
      role: "USER",
    });

    expect(top.every((item) => item.placement === "top-nav")).toBe(true);
  });

  it("skips role filtering when no role is provided so callers can gate at a higher level", () => {
    const dashboardSidebar = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "primary",
      role: null,
    });
    const adminSidebar = getDashboardModules({
      surface: "admin",
      placement: "sidebar",
      role: undefined,
    });

    expect(dashboardSidebar.length).toBeGreaterThan(0);
    expect(adminSidebar.length).toBeGreaterThan(0);
  });

  it("enforces unique module ids across the registry", () => {
    const ids = dashboardModules.map((module) => module.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("exposes the listener inbox sidebar entry to listeners and admins only", () => {
    const listenerView = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "primary",
      role: "LISTENER",
    });
    const userView = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "primary",
      role: "USER",
    });
    const adminView = getDashboardModules({
      surface: "dashboard",
      placement: "sidebar",
      group: "primary",
      role: "ADMIN",
    });

    expect(listenerView.map((m) => m.href)).toContain("/dashboard/listener-inbox");
    expect(userView.map((m) => m.href)).not.toContain("/dashboard/listener-inbox");
    expect(adminView.map((m) => m.href)).toContain("/dashboard/listener-inbox");
  });

  it("limits surface access to authenticated roles", () => {
    expect(canAccessSurface(null, "dashboard")).toBe(false);
    expect(canAccessSurface(undefined, "admin")).toBe(false);
    expect(canAccessSurface("USER", "admin")).toBe(false);
    expect(canAccessSurface("ADMIN", "admin")).toBe(true);
    expect(canAccessSurface("THERAPIST", "dashboard")).toBe(true);
    expect(canAccessSurface("ADMIN", "dashboard")).toBe(true);
  });
});
