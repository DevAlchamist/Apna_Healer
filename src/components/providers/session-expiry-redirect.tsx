"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Redirect off dashboard/admin when NextAuth reports no session (e.g. expired JWT). */
export function SessionExpiryRedirect() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const onProtectedRoute =
      (pathname?.startsWith("/dashboard") ?? false) ||
      (pathname?.startsWith("/admin") ?? false);

    if (!onProtectedRoute) return;

    router.replace("/");
  }, [status, pathname, router]);

  return null;
}
