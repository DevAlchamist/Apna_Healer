"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import type { BookSessionHealer } from "@/components/dashboard/book-session-modal";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import type { ApiProvider } from "@/types/api";
import { formatCurrency } from "@/lib/display";

type PackageAllocation = {
  role: string;
  sessionCount: number;
};

type DbPackage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  price: string;
  discount: number;
  category: string;
  displayOrder: number;
  isFeatured: boolean;
  publicationStatus: string;
  isVisible: boolean;
  durationValue: number;
  durationUnit: string;
  allocations: PackageAllocation[];
};

const SPECIALITY_OPTIONS = [
  { value: "all", label: "All Practices" },
  { value: "anxiety", label: "Anxiety & Stress", match: /anxiety|stress|worry|calm/i },
  { value: "trauma", label: "Trauma & Grief", match: /trauma|ptsd|grief|recovery/i },
  { value: "growth", label: "Personal Growth", match: /growth|resilience|mindful|wellness|existential/i },
  { value: "somatic", label: "Somatic & Body", match: /somatic|body|movement|yoga/i },
] as const;

const VIBE_OPTIONS = [
  { value: "all", label: "Select Vibe" },
  { value: "calm", label: "Calm & Gentle", match: /calm|gentle|mindful|peace/i },
  { value: "direct", label: "Direct & Clear", match: /cbt|clinical|structured|direct/i },
  { value: "warm", label: "Warm & Empathetic", match: /empat|compassion|listen|support/i },
] as const;

type PendingBooking =
  | { type: "general" }
  | { type: "provider"; healer: BookSessionHealer };

function displayName(provider: ApiProvider): string {
  const n = provider.name ?? "Therapist";
  if (/^dr\.?\s/i.test(n)) return n;
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return `Dr. ${parts[parts.length - 1]}`;
  return n;
}

function experienceTag(provider: ApiProvider): string {
  if (provider.sessionCount >= 200) return "15+ Years Exp.";
  if (provider.sessionCount >= 80) return "10+ Years Exp.";
  if (provider.sessionCount >= 20) return "5+ Years Exp.";
  return "8+ Years Exp.";
}

function matchesFilters(
  provider: ApiProvider,
  speciality: string,
  language: string,
  vibe: string,
  centre: string,
  priceRange: string,
  gender: string,
): boolean {
  const haystack = [
    provider.name ?? "",
    provider.bio ?? "",
    ...provider.specializations,
    ...provider.languages,
  ]
    .join(" ")
    .toLowerCase();

  // Language filter
  if (language !== "all" && !provider.languages.some((l) => l.toLowerCase() === language.toLowerCase())) {
    return false;
  }

  // Speciality / Expertise filter
  const spec = SPECIALITY_OPTIONS.find((o) => o.value === speciality);
  if (spec && spec.value !== "all" && "match" in spec && !spec.match.test(haystack)) return false;

  // Vibe filter
  const v = VIBE_OPTIONS.find((o) => o.value === vibe);
  if (v && v.value !== "all" && "match" in v && !v.match.test(haystack)) return false;

  // Centre filter (scan bio/name for center keywords)
  if (centre !== "all") {
    const centreRegex = new RegExp(centre, "i");
    if (!centreRegex.test(haystack)) return false;
  }

  // Price filter
  if (priceRange !== "all") {
    const rate = provider.hourlyRate ? parseFloat(provider.hourlyRate) : 2200;
    if (priceRange === "under1500" && rate >= 1500) return false;
    if (priceRange === "1500-2000" && (rate < 1500 || rate > 2000)) return false;
    if (priceRange === "over2000" && rate <= 2000) return false;
  }

  // Gender filter (heuristic scan of bio and names for gender matches)
  if (gender !== "all") {
    const bioText = (provider.bio ?? "").toLowerCase();
    const nameText = (provider.name ?? "").toLowerCase();
    if (gender === "female") {
      const isFemale = /she\b|her\b|hers\b|dr\.\s+(saher|dyuti|sohini|shreemoyee)/i.test(bioText + " " + nameText);
      if (!isFemale) return false;
    } else if (gender === "male") {
      const isMale = /he\b|him\b|his\b/i.test(bioText) || (/dr\.\s+/i.test(nameText) && !/she\b|her\b/i.test(bioText));
      if (!isMale) return false;
    }
  }

  return true;
}

const TESTIMONIALS = [
  {
    text: "I started therapy not really knowing what it was, with Gauri Saxena, but it just felt so right after 3-4 sessions. My parents could really see how I could identify my errors of thinking, from the roots and how I learnt to replace a toxic belief with a healthy one. Gauri has always astonished me with how she asks the right questions to make me realise myself, my flaws and my strengths. I feel lucky to have found her!",
    user: "• Anonymous Student, Hyderabad",
    therapist: "Gauri Saxena",
    therapistImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80&auto=format&fit=crop"
  },
  {
    text: "I was diagnosed with OCD a few months back. By nature, obsessions are very scary to experience, and it's not something you would want to discuss with anyone. I felt like a big weight was lifted off me when my therapist empathetically listened to me and told me exactly what I was going through. Like there was someone to share this frightening journey. As days passed I was given psychoeducation on OCD, effective techniques to handle intrusive thoughts and other strategies that helped me. I am truly grateful to Kadambari.",
    user: "• Anonymous Software Engineer, Bengaluru",
    therapist: "Kadambari Shahane",
    therapistImg: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80&auto=format&fit=crop"
  },
  {
    text: "I was visiting a therapist before this who I felt did not take the initiative to understand my problems fully and hence was skeptical and afraid to be that open and vulnerable again to another person. I thought I could not do it, but Ms. Mallika has been very supportive in terms of my mental health journey and really just allowing me to feel my emotions and simplifying them for me. I trust her completely and know that even if it requires a lot of effort from my side, she will be patient and understanding towards my problems.",
    user: "• Anonymous Cabin Crew, Delhi",
    therapist: "Ms. Mallika Shah",
    therapistImg: "https://images.unsplash.com/photo-1544367567-0f2fcb009e7b?w=100&q=80&auto=format&fit=crop"
  }
];

export function TherapistsLandingPage() {
  const { status } = useSession();
  const { open: openBookSession } = useBookSessionModal();
  const pendingBookingRef = useRef<PendingBooking | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const [speciality, setSpeciality] = useState("all");
  const [language, setLanguage] = useState("all");
  const [vibe, setVibe] = useState("all");
  const [centre, setCentre] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [gender, setGender] = useState("all");

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const providersQuery = useQuery({
    queryKey: ["public-therapists-landing"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/public/providers?role=THERAPIST&take=24"),
  });

  const packagesQuery = useQuery({
    queryKey: ["public-packages-landing"],
    queryFn: () => apiFetch<DbPackage[]>("/api/packages"),
  });

  const therapists = providersQuery.data ?? [];
  const allPackages = packagesQuery.data ?? [];

  const featuredPackages = useMemo(() => {
    return allPackages.filter((p) => p.isFeatured && p.publicationStatus === "PUBLISHED" && p.isVisible);
  }, [allPackages]);

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    therapists.forEach((t) => t.languages.forEach((l) => set.add(l)));
    return [
      { value: "all", label: "Any Language" },
      ...Array.from(set).sort().map((l) => ({ value: l, label: l })),
    ];
  }, [therapists]);

  const filtered = useMemo(
    () => therapists.filter((p) => matchesFilters(p, speciality, language, vibe, centre, priceRange, gender)),
    [therapists, speciality, language, vibe, centre, priceRange, gender],
  );

  const openJoinModal = useCallback(() => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsSigningIn(false);
    setIsJoinModalOpen(true);
  }, []);

  const runPendingBooking = useCallback(() => {
    const pending = pendingBookingRef.current;
    if (!pending) return;
    pendingBookingRef.current = null;
    if (pending.type === "provider") openBookSession(pending.healer);
    else openBookSession({ preferredRole: "THERAPIST" });
  }, [openBookSession]);

  useEffect(() => {
    if (status === "authenticated") runPendingBooking();
  }, [status, runPendingBooking]);

  useEffect(() => {
    document.body.style.overflow = isJoinModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isJoinModalOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTherapistBooking = useCallback(
    (provider?: ApiProvider) => {
      const healer: BookSessionHealer = provider
        ? {
            providerId: provider.id,
            name: provider.name ?? "Therapist",
            preferredRole: "THERAPIST",
            imageSrc: provider.image,
            specialty: provider.specializations[0] ?? "Therapist",
          }
        : { preferredRole: "THERAPIST" };

      if (status !== "authenticated") {
        pendingBookingRef.current = provider
          ? { type: "provider", healer }
          : { type: "general" };
        openJoinModal();
        return;
      }
      openBookSession(healer);
    },
    [status, openJoinModal, openBookSession],
  );

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn("google", { callbackUrl: "/therapists" });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setIsSigningIn(false);
    }
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const visibleTestimonials = useMemo(() => {
    const list = [];
    const N = TESTIMONIALS.length;
    for (let offset = 0; offset < Math.min(3, N); offset++) {
      list.push(TESTIMONIALS[(testimonialIndex + offset) % N]);
    }
    return list;
  }, [testimonialIndex]);

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#273331] relative">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main>
        {/* Section 1: Header / Expert Selector */}
        <section className="bg-[#fdf6f0] py-16 px-6 text-center border-b border-black/5">
          <div className="mx-auto max-w-[800px]">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1f2827] leading-[1.1]">
              Find an expert who understands your needs.
            </h1>
            
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {/* Therapist Pill (Selected) */}
              <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#2f745f] text-white text-sm font-semibold shadow-md transition-all hover:bg-[#255c4b]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM12 14c-1.38 0-2.5-1.1-2.5-2.5S10.62 9 12 9s2.5 1.1 2.5 2.5S13.38 14 12 14z" />
                </svg>
                Therapist
              </button>

              {/* Psychiatrist Pill */}
              <button
                onClick={() => alert("Psychiatrists section is coming soon!")}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#ebe8e2] text-[#1f2827] text-sm font-semibold hover:bg-[#faf9f6] transition-all"
              >
                <svg className="w-4 h-4 text-[#2f745f] stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4.8 5.8a3 3 0 000 6h4.4a3 3 0 000-6H4.8z" />
                  <path d="M7 11.8v3.4c0 1.5 1.2 2.8 2.8 2.8h4.4c1.5 0 2.8-1.2 2.8-2.8v-3.4" />
                  <path d="M17 11.8V7a4 4 0 00-8 0" />
                </svg>
                Psychiatrist
              </button>

              {/* Child and Youth Expert Pill */}
              <button
                onClick={() => alert("Child and Youth Expert section is coming soon!")}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#ebe8e2] text-[#1f2827] text-sm font-semibold hover:bg-[#faf9f6] transition-all"
              >
                <svg className="w-4 h-4 text-[#2f745f] stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth="3" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth="3" />
                </svg>
                Child and Youth Expert
              </button>

              {/* Couples Therapist Pill */}
              <button
                onClick={() => alert("Couples Therapy section is coming soon!")}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#ebe8e2] text-[#1f2827] text-sm font-semibold hover:bg-[#faf9f6] transition-all"
              >
                <svg className="w-4 h-4 text-[#2f745f] stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                Couples Therapist
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Promo / Guidance Cards */}
        <section className="mx-auto max-w-[1240px] px-6 py-10 md:px-10 grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-[#ebe8e2] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.04)]">
            <div className="max-w-[65%]">
              <h2 className="text-xl font-bold text-[#1f2827]">Need help with finding a therapist?</h2>
              <p className="text-xs text-[#8a9592] mt-2 leading-relaxed">
                Answer a quick questionnaire and find therapists who suit your needs.
              </p>
              <button
                onClick={() => openTherapistBooking()}
                className="mt-6 flex items-center gap-1 text-xs font-bold text-[#2f745f] tracking-wider hover:translate-x-1 transition-transform animate-pulse"
              >
                FIND YOUR FIT →
              </button>
            </div>
            <div className="w-[100px] h-[90px] shrink-0 text-[#2f745f]/70">
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path d="M20 12c0-1.1-.9-2-2-2V7c0-1.1-.9-2-2-2h-3c0-1.1-.9-2-2-2s-2 .9-2 2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2s.9 2 2 2v3c0 1.1.9 2 2 2h3c0 1.1.9 2 2 2s2-.9 2-2h3c1.1 0 2-.9 2-2v-3c1.1 0 2-.9 2-2z" />
              </svg>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex justify-between items-center bg-[#f5f4f0] p-8 rounded-3xl border border-[#ebe8e2] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.04)]">
            <div className="max-w-[65%]">
              <h2 className="text-xl font-bold text-[#1f2827]">Starting Therapy at Apna Healer</h2>
              <p className="text-xs text-[#8a9592] mt-2 leading-relaxed">
                Confused or have doubts? We'll guide you through.
              </p>
              <Link
                href="/blog"
                className="mt-6 flex items-center gap-1 text-xs font-bold text-[#2f745f] tracking-wider hover:translate-x-1 transition-transform"
              >
                LEARN HOW THERAPY HELPS →
              </Link>
            </div>
            <div className="w-[100px] h-[90px] shrink-0 rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80&auto=format&fit=crop')` }} />
          </div>
        </section>

        {/* Section 3: Filter Bar */}
        <section className="mx-auto max-w-[1240px] px-6 py-4 md:px-10" ref={listRef}>
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-[#ebe8e2] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Select Centre Selector */}
            <div className="relative">
              <select
                value={centre}
                onChange={(e) => setCentre(e.target.value)}
                className="appearance-none cursor-pointer pl-9 pr-8 py-2 rounded-full border border-[#ebe8e2] bg-[#faf9f6] text-xs font-bold text-[#1f2827] outline-none transition focus:border-[#2f745f]"
              >
                <option value="all">Select Centre</option>
                <option value="delhi">Delhi NCR</option>
                <option value="gurgaon">Gurgaon</option>
                <option value="bengaluru">Bengaluru</option>
                <option value="mumbai">Mumbai</option>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2f745f]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9592] text-[9px]">
                ▼
              </span>
            </div>

            {/* Vertical separator */}
            <div className="hidden sm:block w-px h-6 bg-[#ebe8e2] mx-1" />

            {/* Expertise Dropdown */}
            <div className="relative">
              <select
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-full border border-[#ebe8e2] bg-[#faf9f6] text-xs font-bold text-[#1f2827] outline-none transition focus:border-[#2f745f]"
              >
                {SPECIALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label === "All Practices" ? "Expertise" : o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9592] text-[9px]">
                ▼
              </span>
            </div>

            {/* Languages Dropdown */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-full border border-[#ebe8e2] bg-[#faf9f6] text-xs font-bold text-[#1f2827] outline-none transition focus:border-[#2f745f]"
              >
                {languageOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label === "Any Language" ? "Languages" : o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9592] text-[9px]">
                ▼
              </span>
            </div>

            {/* Price Dropdown */}
            <div className="relative">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-full border border-[#ebe8e2] bg-[#faf9f6] text-xs font-bold text-[#1f2827] outline-none transition focus:border-[#2f745f]"
              >
                <option value="all">Price</option>
                <option value="under1500">Under ₹1500</option>
                <option value="1500-2000">₹1500 - ₹2000</option>
                <option value="over2000">Over ₹2000</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9592] text-[9px]">
                ▼
              </span>
            </div>

            {/* Gender Dropdown */}
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-full border border-[#ebe8e2] bg-[#faf9f6] text-xs font-bold text-[#1f2827] outline-none transition focus:border-[#2f745f]"
              >
                <option value="all">Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9592] text-[9px]">
                ▼
              </span>
            </div>

            {/* Clear Filters Button */}
            {(speciality !== "all" || language !== "all" || centre !== "all" || priceRange !== "all" || gender !== "all") && (
              <button
                onClick={() => {
                  setSpeciality("all");
                  setLanguage("all");
                  setCentre("all");
                  setPriceRange("all");
                  setGender("all");
                }}
                className="ml-auto text-xs font-semibold text-[#2f745f] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* Section 4 & 7: Therapist Grid & Listings */}
        <section className="mx-auto max-w-[1240px] px-6 py-8 md:px-10 pb-20">
          {providersQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[280px] animate-pulse rounded-3xl bg-[#eceae6]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              className="rounded-3xl border border-dashed border-[#d5dbd8] bg-white px-8 py-16 text-center shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-lg font-semibold text-[#1f2827]">No guides match these filters</p>
              <p className="mt-2 text-sm text-[#6b7573]">Try resetting or selecting different filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSpeciality("all");
                  setLanguage("all");
                  setCentre("all");
                  setPriceRange("all");
                  setGender("all");
                }}
                className="mt-6 rounded-full bg-[#2f745f] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#255c4b]"
              >
                Reset filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Render Row 1 (Index 0 and 1) */}
              {filtered.slice(0, 2).map((provider) => (
                <TherapistCard
                  key={provider.id}
                  provider={provider}
                  onBook={() => openTherapistBooking(provider)}
                />
              ))}

              {/* Section 5: Mid-page questionnaire banner (full width inline) */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-3xl border border-[#ebe8e2] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.05)] mt-4 mb-4">
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block w-14 h-14 shrink-0 text-[#2f745f]/80">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1f2827]">Need help with finding a therapist?</h3>
                      <p className="text-xs text-[#8a9592] mt-1">Answer a quick questionnaire and find therapists who suit your needs.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTherapistBooking()}
                    className="mt-4 md:mt-0 px-6 py-2.5 rounded-xl bg-[#2f745f] hover:bg-[#255c4b] text-xs font-semibold text-white transition shadow-[0_4px_12px_-4px_rgba(47,116,95,0.4)] whitespace-nowrap"
                  >
                    FIND YOUR FIT
                  </button>
                </div>
              </div>

              {/* Section 6: Featured Wellness Packages */}
              <div className="col-span-1 md:col-span-2 mt-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1f2827] tracking-tight">Featured Wellness Packages</h3>
                    <p className="text-xs text-[#8a9592] mt-1">Curated therapeutic journeys designed for deep healing and growth.</p>
                  </div>
                  <Link
                    href="/dashboard/packages"
                    className="text-xs font-bold text-[#2f745f] tracking-wide hover:underline whitespace-nowrap"
                  >
                    VIEW ALL BUNDLES &gt;
                  </Link>
                </div>

                {packagesQuery.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-64 animate-pulse rounded-3xl bg-[#eceae6]" />
                    ))}
                  </div>
                ) : featuredPackages.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#ebe8e2] bg-white p-8 text-center text-xs text-[#8a9592]">
                    No featured packages available at the moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredPackages.map((pkg) => {
                      const originalPrice = Number(pkg.price);
                      const discountPercent = Number(pkg.discount);
                      const finalPrice = originalPrice - originalPrice * (discountPercent / 100);
                      const totalSessions = pkg.allocations?.reduce((sum, a) => sum + a.sessionCount, 0) ?? 0;
                      const sessionsLabel = `${totalSessions} Session${totalSessions === 1 ? "" : "s"}`;
                      const badge = discountPercent > 0 ? `${discountPercent}% Off` : undefined;

                      return (
                        <div
                          key={pkg.id}
                          className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#ebe8e2] bg-white transition-all shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-[#e8ddd0]">
                            {pkg.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pkg.coverImage}
                                alt={pkg.title}
                                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
                              />
                            ) : null}
                            {badge ? (
                              <span className="absolute right-3 top-3 rounded-full bg-[#2f745f] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                                {badge}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex-1 p-5 flex flex-col justify-between text-left">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2f745f]">
                                {sessionsLabel}
                              </p>
                              <h4 className="font-display text-lg font-bold text-[#1f2827] leading-tight">
                                {pkg.title}
                              </h4>
                              <p className="text-xs text-[#8a9592] line-clamp-2 leading-relaxed">
                                {pkg.description}
                              </p>
                            </div>

                            <div className="mt-5 pt-3 border-t border-[#f4f3ef] flex items-end justify-between">
                              <div>
                                {discountPercent > 0 ? (
                                  <p className="text-[10px] font-semibold text-neutral-400 line-through">
                                    {formatCurrency(originalPrice)}
                                  </p>
                                ) : null}
                                <p className="font-display text-xl font-bold text-[#1f2827]">
                                  {formatCurrency(finalPrice)}
                                </p>
                              </div>

                              <Link
                                href={`/dashboard/packages/${pkg.id}`}
                                className="rounded-xl bg-[#faf9f6] border border-[#ebe8e2] px-4 py-2 text-xs font-bold text-[#1f2827] transition hover:bg-[#2f745f] hover:text-white hover:border-[#2f745f]"
                              >
                                VIEW BUNDLE
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Render Row 2 & Remaining Cards (Index 2 onwards) */}
              {filtered.slice(2).map((provider) => (
                <TherapistCard
                  key={provider.id}
                  provider={provider}
                  onBook={() => openTherapistBooking(provider)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 8: Client Testimonials Carousel */}
        <section className="bg-[#eef6eb] py-16 px-6 border-y border-black/5">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2827] max-w-md leading-snug">
                Here’s what our clients say about our therapist
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTestimonial}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#ebe8e2] text-[#1f2827] hover:bg-[#faf9f6] transition shadow-sm font-bold text-sm"
                >
                  &lt;
                </button>
                <button
                  onClick={handleNextTestimonial}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#ebe8e2] text-[#1f2827] hover:bg-[#faf9f6] transition shadow-sm font-bold text-sm"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Testimonials Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleTestimonials.map((t, idx) => (
                <div key={idx} className="flex flex-col justify-between p-6 bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.01)] border border-[#ebe8e2]/60 min-h-[220px]">
                  <div>
                    <p className="text-xs sm:text-sm text-[#5c6865] leading-relaxed italic">
                      "{t.text}"
                    </p>
                    <p className="text-[11px] text-[#8a9592] mt-4 font-semibold">
                      {t.user}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#f4f3ef] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#e8ddd0] overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.therapistImg} alt={t.therapist} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-[#1f2827]">{t.therapist}</span>
                    </div>
                    <button
                      onClick={() => alert(`Exploring profile for ${t.therapist}`)}
                      className="text-xs font-bold text-[#2f745f] hover:underline"
                    >
                      VIEW
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Indicators */}
            <div className="mt-8 flex justify-center gap-2">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestimonialIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    testimonialIndex === idx ? "w-6 bg-[#2f745f]" : "w-1.5 bg-[#d1dcd7]"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Section 9: Metrics / Stats Section */}
        <section className="bg-white py-16 px-6 border-b border-black/5">
          <div className="mx-auto max-w-[1240px] grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {/* Stat 1 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#fdf6f0] text-[#2f745f] mb-4">
                <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="7" />
                  <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
                </svg>
              </div>
              <span className="font-display text-3xl font-extrabold text-[#1f2827]">200+</span>
              <p className="text-[11px] text-[#8a9592] mt-2 max-w-[180px] leading-relaxed">in-house psychologists and psychiatrists</p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#fdf6f0] text-[#2f745f] mb-4">
                <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l.67-1.19" />
                </svg>
              </div>
              <span className="font-display text-3xl font-extrabold text-[#1f2827]">1 lac+</span>
              <p className="text-[11px] text-[#8a9592] mt-2 max-w-[180px] leading-relaxed">therapy and psychiatry sessions in 2024</p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#fdf6f0] text-[#2f745f] mb-4">
                <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 8h14M12 3v18M5 15h14" />
                </svg>
              </div>
              <span className="font-display text-3xl font-extrabold text-[#1f2827]">18</span>
              <p className="text-[11px] text-[#8a9592] mt-2 max-w-[180px] leading-relaxed">languages available for sessions</p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#fdf6f0] text-[#2f745f] mb-4">
                <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="font-display text-3xl font-extrabold text-[#1f2827]">8 centres</span>
              <p className="text-[11px] text-[#8a9592] mt-2 max-w-[180px] leading-relaxed">across Bengaluru, Mumbai, and Delhi NCR</p>
            </div>
          </div>
        </section>

        {/* Section 10: Footer Support & Refer Cards */}
        <section className="mx-auto max-w-[1240px] px-6 py-16 md:px-10 grid gap-6 md:grid-cols-2">
          {/* Support Whatsapp Card */}
          <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-[#ebe8e2] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.04)]">
            <div className="max-w-[65%]">
              <h2 className="text-xl font-bold text-[#1f2827]">Need help choosing?</h2>
              <p className="text-xs text-[#8a9592] mt-2 leading-relaxed">
                We've got you. You can connect with our team and they will assist you in finding a therapist.
              </p>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-xs font-bold text-[#2f745f] tracking-wider hover:underline"
              >
                CHAT ON WHATSAPP
              </a>
            </div>
            <div className="w-[100px] h-[90px] shrink-0 text-[#2f745f]/70">
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
              </svg>
            </div>
          </div>

          {/* Refer Friend Card */}
          <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-[#ebe8e2] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.04)]">
            <div className="max-w-[65%]">
              <h2 className="text-xl font-bold text-[#1f2827]">Help someone take the first step</h2>
              <p className="text-xs text-[#8a9592] mt-2 leading-relaxed">
                Invite someone you care about to try therapy with Apna Healer at a discount. When they complete their first session, you'll receive a little thank you gift from us.
              </p>
              <button
                onClick={() => alert("Referral code: APNAHEAL15 copied to clipboard!")}
                className="mt-6 text-xs font-bold text-[#2f745f] tracking-wider hover:underline text-left"
              >
                REFER A FRIEND
              </button>
            </div>
            <div className="w-[100px] h-[90px] shrink-0 text-[#2f745f]/70">
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {/* Floating Back to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-30 w-11 h-11 rounded-full bg-[#1f2827] text-white flex items-center justify-center shadow-lg transition hover:bg-[#2f3a38]"
        >
          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}

      <LandingJoinModal
        open={isJoinModalOpen}
        onClose={() => !isSigningIn && setIsJoinModalOpen(false)}
        modalMethod={modalMethod}
        onModalMethodChange={(m) => {
          setModalMethod(m);
          setPhoneNumber("");
          setOtpCode("");
          setIsOtpStage(false);
        }}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        otpCode={otpCode}
        onOtpCodeChange={setOtpCode}
        isOtpStage={isOtpStage}
        isSigningIn={isSigningIn}
        onGoogleSignIn={handleGoogleSignIn}
        onPhoneSubmit={(e) => {
          e.preventDefault();
          if (phoneNumber.trim()) setIsOtpStage(true);
        }}
        onOtpSubmit={(e) => e.preventDefault()}
      />
    </div>
  );
}

/* Custom Therapist Card Component */
function TherapistCard({
  provider,
  onBook,
}: {
  provider: ApiProvider;
  onBook: () => void;
}) {
  const { data: session } = useSession();
  const isProvider = session?.user?.role === "THERAPIST" || session?.user?.role === "LISTENER";
  const name = displayName(provider);
  const exp = experienceTag(provider);
  const rate = provider.hourlyRate ? `₹${provider.hourlyRate}` : "₹2200";
  const speaks = provider.languages.join(", ") || "English, Hindi";
  const expertise = provider.specializations.slice(0, 3);
  const imageUrl = provider.image;
  


  const nextSlotStr = useMemo(() => {
    if (provider.nextAvailabilityDate) {
      const date = new Date(provider.nextAvailabilityDate);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth() % 12];
      
      let hours = date.getHours();
      const mins = pad(date.getMinutes());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${pad(hours)}:${mins} ${ampm}`;
      
      return `Next online slot: ${dayName}, ${dayNum} ${monthName} ${timeStr}`;
    }
    return "Next online slot: Thu, 16 Jul 03:30 PM";
  }, [provider.nextAvailabilityDate]);

  return (
    <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-3xl border border-[#ebe8e2] bg-white transition-all shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.06)]">
      {/* Left Column: Media / Photo Box */}
      <div className="relative w-full sm:w-[160px] h-[160px] sm:h-full aspect-square shrink-0 rounded-2xl overflow-hidden bg-[#e8ddd0] group">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-white/40 bg-gradient-to-tr from-[#3d5c50] to-[#b8c9be]">
            {name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/25 transition cursor-pointer">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium tracking-wide">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch video
          </div>
        </div>
      </div>

      {/* Right Column: Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1f2827]">{name}</h3>
              <p className="text-[11px] text-[#8a9592] mt-0.5">{exp}</p>
            </div>
            <div className="text-right">
              <span className="font-display text-base font-bold text-[#1f2827]">{rate}</span>
              <span className="text-[9px] text-[#8a9592] block mt-0.5">for 50 mins</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {expertise.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold bg-[#f4f3ef] text-[#5c6865] px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-2.5 text-xs text-[#5c6865]">
            <span className="text-[#8a9592]">Speaks:</span> {speaks}
          </p>


        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-[#f4f3ef] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-[#5c6865]">
              <svg className="w-3.5 h-3.5 text-[#8a9592]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video, Voice
            </span>
            <span className="font-semibold text-[#c85a49]">{nextSlotStr}</span>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/therapists/${provider.id}`}
              className="flex-1 text-center py-2 rounded-xl border border-[#ebe8e2] text-xs font-semibold text-[#1f2827] hover:bg-[#faf9f6] transition"
            >
              VIEW PROFILE
            </Link>
            {!isProvider && (
              <button
                onClick={onBook}
                className="flex-1 py-2 rounded-xl bg-[#2f745f] hover:bg-[#255c4b] text-xs font-semibold text-white transition shadow-[0_4px_12px_-4px_rgba(47,116,95,0.3)]"
              >
                BOOK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
