"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useListenerSupportModal } from "@/components/dashboard/listener-support-modal";
import { LandingAuthActions } from "@/components/landing/landing-auth-actions";
import {
  HeartHandshakeIcon,
  XIcon,
  MenuIcon,
  HomeIcon,
  UsersIcon,
  PhoneCallIcon,
  CalendarDaysIcon,
  InfoIcon,
  MailIcon,
} from "lucide-react";

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
  const pathname = usePathname();
  const { open: openListenerModal } = useListenerSupportModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"therapists" | "clubs" | "about" | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          Our Professionals
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Find and connect with certified healing experts.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🌸</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Therapists Directory
              </p>
              <p className="text-xs text-ink-500 font-medium">Browse our active certified healers</p>
            </div>
          </Link>
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Verified Credentials
              </p>
              <p className="text-xs text-ink-500 font-medium">100% vetted and verified experts only</p>
            </div>
          </Link>
          <Link
            href="/therapists"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Direct Session Booking
              </p>
              <p className="text-xs text-ink-500 font-medium">Choose slots and schedule in seconds</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Concerns We Support */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          Specializations
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Targeted healing support tailored for you.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/therapists?specialty=anxiety"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🧠</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Anxiety & Stress Healing
            </span>
          </Link>
          <Link
            href="/therapists?specialty=depression"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📉</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Depression Support
            </span>
          </Link>
          <Link
            href="/therapists?specialty=relationships"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🤝</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Relationships & Family
            </span>
          </Link>
          <Link
            href="/therapists?specialty=sleep"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">😴</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Sleep & Restoring Rhythm
            </span>
          </Link>
        </div>
      </div>

      {/* Column 3: Promo Spotlight */}
      <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 border border-sage-100 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sage-600 text-cream-50">
            Offer
          </span>
          <h4 className="font-display text-lg font-bold text-sage-600 mt-3">
            Begin Your Healing Journey
          </h4>
          <p className="text-xs text-ink-700/75 mt-1.5 leading-relaxed font-medium">
            Register today and receive a 15% discount on your first therapist booking session. Take a step towards peace.
          </p>
        </div>
        <Link
          href="/therapists"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-sage-600 text-cream-50 px-5 py-2.5 text-xs font-semibold hover:bg-sage-700 transition-colors mt-4 self-start"
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
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          Safe Spaces
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Anonymous, therapist-facilitated community groups.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">👥</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Community Clubs
              </p>
              <p className="text-xs text-ink-500 font-medium">Connect with others who share your journey</p>
            </div>
          </Link>
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🍃</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Safe Circles
              </p>
              <p className="text-xs text-ink-500 font-medium">Peer-led daily audio sharing boards</p>
            </div>
          </Link>
          <Link
            href="/clubs"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🗣️</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Anonymous Boards
              </p>
              <p className="text-xs text-ink-500 font-medium">Discuss and share stories without revealing identity</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Live Events */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          Workshops & Webinars
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Join interactive sound, yoga, and meditation events.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🧘</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Mindfulness & Breathwork
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🎵</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Sound Healing Circles
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🎨</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Creative Art Therapy
            </span>
          </Link>
          <Link
            href="/events"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📅</span>
            <span className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
              Full Events Calendar
            </span>
          </Link>
        </div>
      </div>

      {/* Column 3: Featured Circle */}
      <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 border border-sage-100 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sage-600 text-cream-50">
            Featured Group
          </span>
          <h4 className="font-display text-lg font-bold text-sage-600 mt-3">
            Morning Woods Circle 🌲
          </h4>
          <p className="text-xs text-ink-700/75 mt-1.5 leading-relaxed font-medium">
            A weekly therapist-guided breathing and sharing circle for mindfulness and peace. Meets every Sunday.
          </p>
        </div>
        <Link
          href="/clubs"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-sage-600 text-cream-50 px-5 py-2.5 text-xs font-semibold hover:bg-sage-700 transition-colors mt-4 self-start"
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
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          About Us
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Discover our mission, team, and healing journey.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🌐</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Our Story
              </p>
              <p className="text-xs text-ink-500 font-medium">Learn more about our founding mission</p>
            </div>
          </Link>
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">🤝</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Meet the Team
              </p>
              <p className="text-xs text-ink-500 font-medium">Founders, healers, and wellness advisors</p>
            </div>
          </Link>
          <Link
            href="/about"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📈</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Our Impact
              </p>
              <p className="text-xs text-ink-500 font-medium">Review community stories and wellness numbers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 2: Blog & Insights */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-600">
          Blog &amp; Insights
        </h3>
        <p className="text-xs text-ink-500/80 -mt-2">
          Wellness tips, expert articles, and resources.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📖</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Healing Blog
              </p>
              <p className="text-xs text-ink-500 font-medium">Browse articles by category and healers</p>
            </div>
          </Link>
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Mental Health Guides
              </p>
              <p className="text-xs text-ink-500 font-medium">Actionable guides for stress and rest</p>
            </div>
          </Link>
          <Link
            href="/blog"
            onClick={() => setActiveDropdown(null)}
            className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-cream-200/50"
          >
            <span className="text-lg">📰</span>
            <div>
              <p className="text-sm font-semibold text-ink-900 group-hover:text-sage-600 transition-colors">
                Press Releases
              </p>
              <p className="text-xs text-ink-500 font-medium">Read Apna Healer news and announcements</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Column 3: Featured Article Promo */}
      <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 border border-sage-100 p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sage-600 text-cream-50">
            Featured Post
          </span>
          <h4 className="font-display text-lg font-bold text-sage-600 mt-3">
            5 Mindfulness Exercises for Calm
          </h4>
          <p className="text-xs text-ink-700/75 mt-1.5 leading-relaxed font-medium">
            Explore daily self-guided breathing practices to ease stress and restore clarity in under 5 minutes.
          </p>
        </div>
        <Link
          href="/blog"
          onClick={() => setActiveDropdown(null)}
          className="inline-flex items-center justify-center rounded-full bg-sage-600 text-cream-50 px-5 py-2.5 text-xs font-semibold hover:bg-sage-700 transition-colors mt-4 self-start"
        >
          Read Article →
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <header
        ref={navContainerRef}
        onMouseLeave={startCloseTimeout}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-cream-300 bg-cream-50/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
          }`}
      >
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            onClick={() => setActiveDropdown(null)}
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Apna Healer home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl">
              <img
                src="/logo.svg"
                alt=""
                width={84}
                height={80}
                className="h-full w-full object-cover  object-center"
                draggable={false}
              />
            </span>
            <span className="font-display text-lg tracking-tight text-ink-900">
              Apna<span className="text-sage-600">Healer</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {LEFT_NAV_LINKS.map((link) => {
              const active = activeDropdown === link.type;
              if (link.hasMegamenu) {
                return (
                  <div
                    key={link.label}
                    className="relative py-2"
                    onMouseEnter={() => handleOpenDropdown(link.type)}
                  >
                    <button
                      onClick={(e) => handleToggleDropdown(link.type, e)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition hover:bg-cream-200/85 hover:text-ink-900 font-semibold focus:outline-none ${active ? "bg-cream-200/85 text-[#55764c]" : "text-ink-500"
                        }`}
                    >
                      {link.label}
                      <svg
                        className={`h-3 w-3 transition-transform duration-300 ${active ? "rotate-180 text-sage-600" : "text-ink-400"
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
                  className="rounded-full px-4 py-2 text-sm text-ink-500 transition hover:bg-cream-200/85 hover:text-ink-900 font-semibold"
                >
                  {link.label}
                </Link>
              );
            })}
            {RIGHT_NAV_LINKS.map((link) => {
              const active = activeDropdown === link.type;
              if (link.hasMegamenu) {
                return (
                  <div
                    key={link.label}
                    className="relative py-2"
                    onMouseEnter={() => handleOpenDropdown(link.type)}
                  >
                    <button
                      onClick={(e) => handleToggleDropdown(link.type, e)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition hover:bg-cream-200/85 hover:text-ink-900 font-semibold focus:outline-none ${active ? "bg-cream-200/85 text-[#55764c]" : "text-ink-500"
                        }`}
                    >
                      {link.label}
                      <svg
                        className={`h-3 w-3 transition-transform duration-300 ${active ? "rotate-180 text-sage-600" : "text-ink-400"
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
                  className="rounded-full px-4 py-2 text-sm text-ink-500 transition hover:bg-cream-200/85 hover:text-ink-900 font-semibold"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/#listeners"
              onClick={() => setActiveDropdown(null)}
              className="hidden items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-4 py-2.5 text-sm font-medium text-sage-700 transition hover:border-sage-300 hover:bg-sage-100 sm:inline-flex"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
              </span>
              Listeners online
            </Link>

            <LandingAuthActions onJoinClick={onJoinClick} />
          </div>
        </div>

        {/* Megamenu dropdown panel container */}
        <AnimatePresence>
          {activeDropdown ? (
            <motion.div
              className="absolute left-0 right-0 top-full w-full bg-[#fdfcf9]/98 backdrop-blur-md border-b border-cream-300 shadow-lift overflow-hidden z-25"
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

      {/* Mobile Bottom Tab Bar */}
      <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="pb-safe border-t border-cream-300/70 bg-[#faf9f5]/90 shadow-[0_-10px_35px_-15px_rgba(85,118,76,0.3)] backdrop-blur-md">
          <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch px-2">

            {/* Tab 1: Home */}
            <Link
              href="/"
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname === "/" ? "text-[#55764c]" : "text-text-primary/60"
                }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
              <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname === "/" ? "bg-[#55764c]" : "bg-transparent"}`} />
            </Link>

            {/* Tab 2: Therapists */}
            <Link
              href="/therapists"
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname === "/therapists" ? "text-[#55764c]" : "text-text-primary/60"
                }`}
            >
              <UsersIcon className="h-5 w-5" />
              <span>Therapists</span>
              <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname === "/therapists" ? "bg-[#55764c]" : "bg-transparent"}`} />
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

            {/* Tab 4: Events */}
            <Link
              href="/events"
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${pathname === "/events" ? "text-[#55764c]" : "text-text-primary/60"
                }`}
            >
              <CalendarDaysIcon className="h-5 w-5" />
              <span>Events</span>
              <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${pathname === "/events" ? "bg-[#55764c]" : "bg-transparent"}`} />
            </Link>

            {/* Tab 5: Menu */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setIsMenuOpen(true)}
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${isMenuOpen || ["/clubs", "/about", "/contact"].includes(pathname)
                ? "text-[#55764c]"
                : "text-text-primary/60"
                }`}
            >
              <MenuIcon className="h-5 w-5" />
              <span>Menu</span>
              <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${["/clubs", "/about", "/contact"].includes(pathname) ? "bg-[#55764c]" : "bg-transparent"}`} />
            </motion.button>

          </div>
        </div>
      </nav>

      {/* Spacer to push content above mobile tab bar */}
      {/* <div className="h-16 lg:hidden" aria-hidden="true" /> */}

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

function MobileMenuSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const sheetLinks = [
    { label: "Clubs & circles", href: "/clubs", icon: UsersIcon },
    { label: "Events", href: "/events", icon: CalendarDaysIcon },
    { label: "About us", href: "/about", icon: InfoIcon },
    { label: "Contact", href: "/contact", icon: MailIcon },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25 backdrop-blur-xs"
          />
          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-[#faf9f5] p-5 pb-12 shadow-2xl border-t border-cream-300"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-text-secondary">Menu</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/50 transition-colors hover:bg-accent/40"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-1">
              {sheetLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${active
                        ? "bg-[#55764c]/20 text-[#55764c]"
                        : "text-text-primary hover:bg-accent/30"
                        }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#55764c]/10 text-[#55764c]">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
