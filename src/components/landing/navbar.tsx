"use client";

const NAV_LINKS = [
  { label: "About", href: "/about" },
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
        <a href="/" className="text-[30px] font-bold tracking-[-0.03em] text-[#2f745f]">
          ApnaHealer
        </a>
        <nav className="hidden items-center gap-10 text-[15px] text-[#3e4b4a] md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors duration-200 hover:text-[#2f745f]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        {onJoinClick ? (
          <button
            type="button"
            onClick={onJoinClick}
            className="rounded-full bg-[#2f745f] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245d4c]"
          >
            Join us
          </button>
        ) : (
          <a
            href="/"
            className="rounded-full bg-[#2f745f] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245d4c]"
          >
            Join us
          </a>
        )}
      </div>
    </header>
  );
}
