"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingAuthActions } from "@/components/landing/landing-auth-actions";

const LEFT_NAV_LINKS = [
  { label: "Therapists", href: "/therapists", hasMegamenu: true, type: "therapists" as const },
  { label: "Clubs", href: "/clubs", hasMegamenu: true, type: "clubs" as const },
  { label: "Events", href: "/events" },
];

const RIGHT_NAV_LINKS = [
  { label: "About Us", href: "/about", hasMegamenu: true, type: "about" as const },
  { label: "Contact", href: "/contact" },
];

type LandingNavbarProps = {
  onJoinClick?: () => void;
};

export function LandingNavbar({ onJoinClick }: LandingNavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<"therapists" | "clubs" | "about" | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Clear closing timeout
  const clearCloseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set close delay to prevent accidental dismissals on mouse leave
  const startCloseTimeout = useCallback(() => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  }, [clearCloseTimeout]);

  // Open instantly on hover
  const handleOpenDropdown = useCallback((type: "therapists" | "clubs" | "about") => {
    clearCloseTimeout();
    setActiveDropdown(type);
  }, [clearCloseTimeout]);

  // Toggle on click
  const handleToggleDropdown = useCallback((type: "therapists" | "clubs" | "about", e: React.MouseEvent) => {
    e.preventDefault();
    clearCloseTimeout();
    setActiveDropdown((current) => (current === type ? null : type));
  }, [clearCloseTimeout]);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close when clicking outside navbar container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const renderTherapistsMegamenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 max-w-[1240px] mx-auto">
      {/* Column 1: Expert Directory */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          Our Professionals
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Find and connect with certified healing experts.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🌸</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Therapists Directory
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Browse our active certified healers</p>
            </div>
          </Link>
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Verified Credentials
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">100% vetted and verified experts only</p>
            </div>
          </Link>
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Direct Session Booking
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Choose slots and schedule in seconds</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Concerns We Support */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          Specializations
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Targeted healing support tailored for you.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/therapists?specialty=anxiety"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🧠</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Anxiety & Stress Healing
            </span>
          </Link>
          <Link
            href="/therapists?specialty=depression"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📉</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Depression Support
            </span>
          </Link>
          <Link
            href="/therapists?specialty=relationships"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🤝</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Relationships & Family
            </span>
          </Link>
          <Link
            href="/therapists?specialty=sleep"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">😴</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Sleep & Restoring Rhythm
            </span>
          </Link>
        </div>
      </div>

      {/* Column 3: Promo Spotlight */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2f745f]/15 to-[#eae8e4]/45 border border-[#2f745f]/10 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2f745f] text-white">
            Offer
          </span>
          <h4 className="font-display text-lg font-bold text-[#2f745f] mt-3">
            Begin Your Healing Journey
          </h4>
          <p className="text-xs text-[#3e4b4a]/75 mt-1.5 leading-relaxed font-medium">
            Register today and receive a 15% discount on your first therapist booking session. Take a step towards peace.
          </p>
        </div>
        <Link
          href="/therapists"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-[#2f745f] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#255b4b] transition-colors mt-4 self-start"
        >
          Find Your Healer →
        </Link>
      </div>
    </div>
  );

  const renderClubsMegamenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 max-w-[1240px] mx-auto">
      {/* Column 1: Support Circles */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          Safe Spaces
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Anonymous, therapist-facilitated community groups.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">👥</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Community Clubs
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Connect with others who share your journey</p>
            </div>
          </Link>
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🍃</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Safe Circles
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Peer-led daily audio sharing boards</p>
            </div>
          </Link>
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🗣️</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Anonymous Boards
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Discuss and share stories without revealing identity</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Live Events */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          Workshops & Webinars
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Join interactive sound, yoga, and meditation events.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🧘</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Mindfulness & Breathwork
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🎵</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Sound Healing Circles
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🎨</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Creative Art Therapy
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📅</span>
            <span className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
              Full Events Calendar
            </span>
          </Link>
        </div>
      </div>

      {/* Column 3: Featured Circle */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2f745f]/15 to-[#eae8e4]/45 border border-[#2f745f]/10 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2f745f] text-white">
            Featured Group
          </span>
          <h4 className="font-display text-lg font-bold text-[#2f745f] mt-3">
            Morning Woods Circle 🌲
          </h4>
          <p className="text-xs text-[#3e4b4a]/75 mt-1.5 leading-relaxed font-medium">
            A weekly therapist-guided breathing and sharing circle for mindfulness and peace. Meets every Sunday.
          </p>
        </div>
        <Link
          href="/clubs"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-[#2f745f] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#255b4b] transition-colors mt-4 self-start"
        >
          Join Active Circle →
        </Link>
      </div>
    </div>
  );

  const renderAboutMegamenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 max-w-[1240px] mx-auto">
      {/* Column 1: About Us */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          About Us
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Discover our mission, team, and healing journey.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🌐</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Our Story
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Learn more about our founding mission</p>
            </div>
          </Link>
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">🤝</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Meet the Team
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Founders, healers, and wellness advisors</p>
            </div>
          </Link>
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📈</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Our Impact
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Review community stories and wellness numbers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Blog & Insights */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f745f]/70">
          Blog &amp; Insights
        </h3>
        <p className="text-xs text-[#3e4b4a]/60 -mt-2">
          Wellness tips, expert articles, and resources.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📖</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Healing Blog
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Browse articles by category and healers</p>
            </div>
          </Link>
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Mental Health Guides
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Actionable guides for stress and rest</p>
            </div>
          </Link>
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <span className="text-lg">📰</span>
            <div>
              <p className="text-sm font-semibold text-[#3e4b4a] group-hover:text-[#2f745f] transition-colors">
                Press Releases
              </p>
              <p className="text-xs text-[#3e4b4a]/60 font-medium">Read Apna Healer news and announcements</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 3: Featured Article Promo */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2f745f]/15 to-[#eae8e4]/45 border border-[#2f745f]/10 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2f745f] text-white">
            Featured Post
          </span>
          <h4 className="font-display text-lg font-bold text-[#2f745f] mt-3">
            5 Mindfulness Exercises for Calm
          </h4>
          <p className="text-xs text-[#3e4b4a]/75 mt-1.5 leading-relaxed font-medium">
            Explore daily self-guided breathing practices to ease stress and restore clarity in under 5 minutes.
          </p>
        </div>
        <Link
          href="/blog"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-[#2f745f] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#255b4b] transition-colors mt-4 self-start"
        >
          Read Article →
        </Link>
      </div>
    </div>
  );

  return (
    <header
      ref={navContainerRef}
      onMouseLeave={startCloseTimeout}
      className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f7f5]/95 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            onClick={() => setActiveDropdown(null)}
            className="text-[30px] font-bold tracking-[-0.03em] text-[#2f745f] shrink-0"
          >
            ApnaHealer
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] text-[#3e4b4a] md:flex">
            {LEFT_NAV_LINKS.map((link) => {
              if (link.hasMegamenu) {
                const active = activeDropdown === link.type;
                return (
                  <div
                    key={link.label}
                    className="relative py-2"
                    onMouseEnter={() => handleOpenDropdown(link.type)}
                  >
                    <button
                      onClick={(e) => handleToggleDropdown(link.type, e)}
                      className={`flex items-center gap-1.5 transition-colors duration-200 hover:text-[#2f745f] font-semibold focus:outline-none ${
                        active ? "text-[#2f745f]" : "text-[#3e4b4a]"
                      }`}
                    >
                      {link.label}
                      <svg
                        className={`h-3 w-3 transition-transform duration-300 ${
                          active ? "rotate-180 text-[#2f745f]" : "text-[#3e4b4a]/60"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="transition-colors duration-200 hover:text-[#2f745f] font-semibold"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-8 text-[15px] text-[#3e4b4a] md:flex">
            {RIGHT_NAV_LINKS.map((link) => {
              if (link.hasMegamenu) {
                const active = activeDropdown === link.type;
                return (
                  <div
                    key={link.label}
                    className="relative py-2"
                    onMouseEnter={() => handleOpenDropdown(link.type)}
                  >
                    <button
                      onClick={(e) => handleToggleDropdown(link.type, e)}
                      className={`flex items-center gap-1.5 transition-colors duration-200 hover:text-[#2f745f] font-semibold focus:outline-none ${
                        active ? "text-[#2f745f]" : "text-[#3e4b4a]"
                      }`}
                    >
                      {link.label}
                      <svg
                        className={`h-3 w-3 transition-transform duration-300 ${
                          active ? "rotate-180 text-[#2f745f]" : "text-[#3e4b4a]/60"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="transition-colors duration-200 hover:text-[#2f745f] font-semibold"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <LandingAuthActions onJoinClick={onJoinClick} />
        </div>
      </div>

      {/* Megamenu dropdown panel container */}
      <AnimatePresence>
        {activeDropdown ? (
          <motion.div
            className="absolute left-0 right-0 top-full w-full bg-[#f7f7f5]/98 backdrop-blur-md border-b border-black/10 shadow-xl overflow-hidden z-20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={clearCloseTimeout}
          >
            {activeDropdown === "therapists" ? renderTherapistsMegamenu() : null}
            {activeDropdown === "clubs" ? renderClubsMegamenu() : null}
            {activeDropdown === "about" ? renderAboutMegamenu() : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
