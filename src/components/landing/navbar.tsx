"use client";

import Link from "next/link";
import { LandingAuthActions } from "@/components/landing/landing-auth-actions";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Therapists", href: "/therapists" },
  { label: "Clubs", href: "/clubs" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/contact" },
];

type LandingNavbarProps = {
  onJoinClick?: () => void;
};

export function LandingNavbar({ onJoinClick }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f7f5]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="text-[30px] font-bold tracking-[-0.03em] text-[#2f745f]"
        >
          ApnaHealer
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] text-[#3e4b4a] md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors duration-200 hover:text-[#2f745f]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <LandingAuthActions onJoinClick={onJoinClick} />
      </div>
    </header>
  );
}
