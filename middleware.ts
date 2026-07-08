import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type AppRole = "ADMIN" | "USER" | "THERAPIST" | "LISTENER";

const DASHBOARD_ROLES: ReadonlySet<AppRole> = new Set([
  "USER",
  "THERAPIST",
  "LISTENER",
]);

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (!token?.sub) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const role = (typeof token.role === "string" ? token.role : undefined) as
    | AppRole
    | undefined;

  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (!role || !DASHBOARD_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-specific sub-path guards
    if (role === "THERAPIST") {
      const blocked = [
        "/dashboard/wallet",
        "/dashboard/packages",
        "/dashboard/my-sessions",
        "/dashboard/listener-inbox",
        "/dashboard/support-requests",
        "/dashboard/impact",
        "/dashboard/training-center",
      ];
      if (blocked.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (role === "LISTENER") {
      const blocked = [
        "/dashboard/wallet",
        "/dashboard/packages",
        "/dashboard/my-sessions",
        "/dashboard/consultations",
        "/dashboard/patients",
        "/dashboard/analytics",
      ];
      if (blocked.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (role === "USER") {
      const blocked = [
        "/dashboard/listener-inbox",
        "/dashboard/consultations",
        "/dashboard/earnings",
        "/dashboard/patients",
        "/dashboard/analytics",
        "/dashboard/support-requests",
        "/dashboard/impact",
        "/dashboard/training-center",
      ];
      if (blocked.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
