"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { apiFetch } from "@/lib/api-client";
import { displayAccountLabel, formatCurrency } from "@/lib/display";
import type { ApiUser } from "@/types/api";

type LandingAuthActionsProps = {
  onJoinClick?: () => void;
};

export function LandingAuthActions({ onJoinClick }: LandingAuthActionsProps) {
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
    enabled: status === "authenticated",
  });

  const user = userQuery.data;
  const walletBalance = formatCurrency(user?.wallet?.availableBalance);
  const accountLabel = displayAccountLabel(user?.name, user?.email);

  useEffect(() => {
    if (!menuOpen || signOutOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, signOutOpen]);

  if (status === "loading") {
    return (
      <div
        className="h-10 w-28 animate-pulse rounded-full bg-[#e8e6e1]"
        aria-hidden
      />
    );
  }

  if (status !== "authenticated") {
    if (onJoinClick) {
      return (
        <button
          type="button"
          onClick={onJoinClick}
          className="rounded-full bg-[#2f745f] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245d4c]"
        >
          Start Healing
        </button>
      );
    }
    return (
      <Link
        href="/"
        className="rounded-full bg-[#2f745f] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245d4c]"
      >
        Start Healing
      </Link>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {user?.role === "USER" ? (
          <Link
            href="/dashboard/wallet"
            className="hidden items-center rounded-full bg-[#e9e3da] px-4 py-2 text-sm font-semibold text-[#3e4b4a] transition-colors hover:bg-[#dfd7cc] sm:inline-flex"
            aria-label="Wallet balance"
          >
            {walletBalance}
          </Link>
        ) : null}
        <NotificationBell />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center rounded-full border border-[#d8d4cc] bg-white py-1.5 px-1.5 text-sm font-semibold text-[#3e4b4a] transition hover:border-[#2f745f]/40"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <UserAvatarCircle
              name={user?.name}
              email={user?.email}
              image={user?.image}
              className="h-8 w-8"
            />
            {/* <span className="hidden max-w-[120px] truncate md:inline">
              {accountLabel}
            </span> */}
          </button>
          {menuOpen && !signOutOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-[#e6e2da] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)]"
            >
              <Link
                href="/dashboard"
                role="menuitem"
                className="block px-4 py-2.5 text-sm font-medium text-[#3e4b4a] transition hover:bg-[#f4f2ed]"
                onClick={() => setMenuOpen(false)}
              >
                Go to dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                role="menuitem"
                className="block px-4 py-2.5 text-sm font-medium text-[#3e4b4a] transition hover:bg-[#f4f2ed]"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              {user?.role === "USER" ? (
                <Link
                  href="/dashboard/wallet"
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm font-medium text-[#3e4b4a] transition hover:bg-[#f4f2ed] sm:hidden"
                  onClick={() => setMenuOpen(false)}
                >
                  Wallet · {walletBalance}
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#9a2d2d] transition hover:bg-[#fdf0ee]"
                onClick={() => {
                  setMenuOpen(false);
                  setSignOutOpen(true);
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <SignOutDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        userLabel={accountLabel}
        callbackUrl="/"
        variant="landing"
      />
    </>
  );
}
