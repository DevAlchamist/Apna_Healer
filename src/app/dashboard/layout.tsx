import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";

/**
 * Server-side guard so admins are bounced to /admin even when their JWT cookie
 * is stale (middleware reads the cookie directly and cannot trigger NextAuth's
 * jwt callback). `getServerSession` re-runs the jwt callback, which refreshes
 * the role from the database before we make the redirect decision.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
