"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { ListenersOnlineMarquee } from "@/components/landing/listeners-online-marquee";
import { LandingNavbar } from "@/components/landing/navbar";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { useListenerSupportModal } from "@/components/dashboard/listener-support-modal";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiPublicClubSummary, ApiPublicHomeBundle, ApiProvider } from "@/types/api";

const heroSlides = [
  {
    title: "Feel Together,",
    highlight: "Heal Together.",
    description:
      "Step into a sanctuary designed for your mental well-being. Whether you need a listening ear or professional guidance, we cradle your journey with care.",
    visual:
      "bg-[radial-gradient(circle_at_50%_20%,#d6c4a4,#8f6e4a_45%,#3f2b1f)]",
  },
  {
    title: "Speak Freely,",
    highlight: "Breathe Deeply.",
    description:
      "A calming digital home where every conversation is held with empathy, confidentiality, and a sense of belonging.",
    visual:
      "bg-[radial-gradient(circle_at_55%_30%,#b8ddd1,#5f8f7f_48%,#2b5045)]",
  },
  {
    title: "Grow Gently,",
    highlight: "Shine Daily.",
    description:
      "From listeners to licensed therapists, find the right support circle and keep your emotional wellness journey moving forward.",
    visual:
      "bg-[radial-gradient(circle_at_48%_20%,#e6d4b7,#aa8862_45%,#5e4732)]",
  },
] as const;

const fallbackVoiceColumns = [
  [
    "The ability to find a listener at 2 AM when anxiety was peaking saved my week.",
    "The matching algorithm actually works. My therapist understands my cultural background deeply.",
    "I finally feel like I can ask for help without being judged.",
  ],
  [
    "Finally a place that feels soft and professional. Most apps feel rushed.",
    "The rituals and events keep me grounded every single day.",
    "I went from overwhelmed to supported in less than one week.",
  ],
  [
    "I was skeptical at first, but the empathy I received was incredible.",
    "Quiet, beautiful design that does not overwhelm. The sanctuary is my favorite corner.",
    "Even short check-ins make a huge difference in my mood.",
  ],
] as const;

const fallbackFaqItems = [
  {
    question: "How do I know if I need a therapist or a listener?",
    answer:
      "Therapists are trained professionals for deep clinical work. Listeners provide peer support and empathy for everyday challenges.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. We follow strong data protection practices, secure storage, and strict access controls to keep your information safe.",
  },
  {
    question: "How are listeners vetted?",
    answer:
      "Listeners go through screening, empathy assessments, and platform onboarding before they are made available for sessions.",
  },
  {
    question: "Can I switch therapists if it's not a match?",
    answer:
      "Absolutely. You can request a new therapist anytime so you can find the support relationship that feels right for you.",
  },
] as const;

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

const THERAPIST_GRADIENTS = [
  "bg-[linear-gradient(120deg,#35a7bc,#2e7ca2)]",
  "bg-[linear-gradient(120deg,#5ec5b8,#2796c1)]",
  "bg-[linear-gradient(120deg,#244961,#2f8db5)]",
  "bg-[linear-gradient(120deg,#6b8f7f,#3d5a4c)]",
];

function therapistTag(provider: ApiProvider) {
  const spec = provider.specializations[0];
  if (spec) return spec;
  return "Wellness Support";
}

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const { open: openBookSession } = useBookSessionModal();
  const { open: openListenerSupport } = useListenerSupportModal();
  const pendingBookingRef = useRef<"therapist" | "listener" | null>(null);

  const homeQuery = useQuery({
    queryKey: ["public-home"],
    queryFn: () => apiFetch<ApiPublicHomeBundle>("/api/public/home"),
  });

  const clubsQuery = useQuery({
    queryKey: ["public-clubs-home"],
    queryFn: () => apiFetch<ApiPublicClubSummary[]>("/api/public/clubs?take=6"),
  });

  const home = homeQuery.data;
  const publicClubs = clubsQuery.data ?? [];
  const voiceColumns = home?.testimonials?.length ? home.testimonials : fallbackVoiceColumns;
  const faqItems = home?.faq?.length ? home.faq : fallbackFaqItems;
  const featuredTherapists = home?.featuredTherapists ?? [];
  const upcomingEvents = home?.upcomingEvents ?? [];
  const stats = home?.stats;

  const [heroIndex, setHeroIndex] = useState(0);
  const [proSlide, setProSlide] = useState(0);
  const [activeListenerIdx, setActiveListenerIdx] = useState(0);

  const carouselListeners = useMemo(() => {
    let base = [];
    if (home?.listeners && home.listeners.length > 0) {
      base = home.listeners.map((listener) => ({
        name: listener.name || "Anonymous Listener",
        image: listener.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80&auto=format&fit=crop",
      }));
    } else {
      base = [
        { name: "Priya S.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80&auto=format&fit=crop" },
        { name: "Rohan M.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&auto=format&fit=crop" },
        { name: "Ananya K.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&auto=format&fit=crop" },
        { name: "Siddharth R.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop" },
        { name: "Meera J.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&auto=format&fit=crop" },
        { name: "Kabir D.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop" },
        { name: "Neha W.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80&auto=format&fit=crop" },
      ];
    }
    // Pad base array to at least 7 items by duplicating
    const result = [...base];
    let multiplier = 1;
    while (result.length < 7) {
      result.push(...base.map((item) => ({ ...item, name: `${item.name} (${multiplier})` })));
      multiplier++;
    }
    return result;
  }, [home?.listeners]);

  const currentListener = carouselListeners[activeListenerIdx % carouselListeners.length] || carouselListeners[0];

  const handlePrevListener = () => {
    setActiveListenerIdx((prev) => (prev === 0 ? carouselListeners.length - 1 : prev - 1));
  };
  const handleNextListener = () => {
    setActiveListenerIdx((prev) => (prev === carouselListeners.length - 1 ? 0 : prev + 1));
  };


  const PROFESSIONALS_VISIBLE = 4;
  const canSlideProfessionals = featuredTherapists.length > PROFESSIONALS_VISIBLE;
  const visibleProfessionals = useMemo(() => {
    if (featuredTherapists.length === 0) return [];
    const count = Math.min(PROFESSIONALS_VISIBLE, featuredTherapists.length);
    return Array.from({ length: count }, (_, i) => {
      const index = (proSlide + i) % featuredTherapists.length;
      return featuredTherapists[index]!;
    });
  }, [featuredTherapists, proSlide]);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isJoinModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isJoinModalOpen]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (searchParams.get("next") && status === "unauthenticated") {
      setIsJoinModalOpen(true);
    }
  }, [searchParams, status]);

  const openJoinModal = useCallback(() => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsSigningIn(false);
    setIsJoinModalOpen(true);
  }, []);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (status !== "authenticated") {
        openJoinModal();
        return;
      }
      action();
    },
    [status, openJoinModal],
  );

  const openTherapistBooking = useCallback(() => {
    if (status !== "authenticated") {
      pendingBookingRef.current = "therapist";
      openJoinModal();
      return;
    }
    openBookSession({ preferredRole: "THERAPIST" });
  }, [status, openJoinModal, openBookSession]);

  const openListenerBooking = useCallback(() => {
    if (status !== "authenticated") {
      pendingBookingRef.current = "listener";
      openJoinModal();
      return;
    }
    openListenerSupport();
  }, [status, openJoinModal, openListenerSupport]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const pending = pendingBookingRef.current;
    if (!pending) return;
    pendingBookingRef.current = null;
    if (pending === "therapist") {
      openBookSession({ preferredRole: "THERAPIST" });
    } else {
      openListenerSupport();
    }
  }, [status, openBookSession, openListenerSupport]);

  const closeJoinModal = () => {
    if (isSigningIn) return;
    setIsJoinModalOpen(false);
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setIsSigningIn(false);
    }
  };

  const handlePhoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      return;
    }
    setIsOtpStage(true);
  };

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpCode.trim()) {
      return;
    }
  };

  const featuredClub = publicClubs[0];
  const secondaryClubs = publicClubs.slice(1, 3);

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />
      <main>
        <motion.section
          id="about"
          className="mx-auto max-w-[1240px] px-6 pb-16 pt-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              key={heroSlides[heroIndex].title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex rounded-full bg-[#bcead8] px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2d7561]">
                A New Path to Inner Peace
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#1f2827] md:text-7xl">
                {heroSlides[heroIndex].title}
                <br />
                <span className="italic text-[#2f745f]">
                  {heroSlides[heroIndex].highlight}
                </span>
              </h1>
              <p className="mt-6 max-w-[510px] text-[18px] leading-8 text-[#5d6664]">
                {heroSlides[heroIndex].description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={openListenerBooking}
                  className="rounded-full bg-[#2f745f] px-8 py-4 text-sm font-semibold text-white shadow-md"
                >
                  Talk to a Listener
                </button>
                <Link
                  href="/therapists"
                  className="rounded-full bg-[#e7dacd] px-8 py-4 text-sm font-semibold text-[#3e4a48] transition hover:bg-[#ded3c4]"
                >
                  Find Your Therapist
                </Link>
              </div>
              <div className="mt-7 flex gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === heroIndex
                        ? "w-10 bg-[#2f745f]"
                        : "w-2.5 bg-[#b8c4c1]"
                    }`}
                    aria-label={`Go to hero slide ${idx + 1}`}
                    onClick={() => setHeroIndex(idx)}
                  />
                ))}
              </div>
            </motion.div>
            <div className="relative h-[500px] overflow-hidden rounded-[40px] shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlides[heroIndex].visual}
                  className={`absolute inset-0 ${heroSlides[heroIndex].visual}`}
                  initial={{ opacity: 0.3, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.35, scale: 0.95 }}
                  transition={{ duration: 0.65 }}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-[#faf9f6] py-16 border-b border-black/5"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Sage Green: Listener support card */}
              <motion.article
                className="rounded-xl bg-[#dce9dd]/75 border border-[#c4dcce] p-8 shadow-[0_12px_44px_-16px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[320px]"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-4">
                  <span className="inline-block rounded-full border border-[#235844]/35 bg-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#235844]">
                    Available 24/7
                  </span>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#1f2827] sm:text-3xl">
                    Need Someone To Talk To?
                  </h3>
                  <p className="max-w-[460px] text-sm leading-relaxed text-[#5c6865]">
                    Connect with a compassionate listener in a safe and supportive space.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="rounded-lg border border-[#c4dcce]/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#235844]">
                      Private.
                    </span>
                    <span className="rounded-lg border border-[#c4dcce]/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#235844]">
                      100% Anonymous.
                    </span>
                    <span className="rounded-lg border border-[#c4dcce]/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#235844]">
                      Judgment-Free.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openListenerBooking}
                  className="mt-8 flex w-full items-center justify-between rounded-full bg-[#235844] py-3.5 px-5 text-sm font-bold text-white transition hover:bg-[#1b4334] shadow-[0_12px_28px_-8px_rgba(35,88,68,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 fill-current text-white/95" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                    </svg>
                    <span>Talk to a Listener</span>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#235844]">
                    <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </motion.article>

              {/* Lavender: Expert support card */}
              <motion.article
                className="rounded-xl bg-[#ebdffd]/75 border border-[#ddcbfa] p-8 shadow-[0_12px_44px_-16px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[320px]"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-4">
                  <span className="inline-block rounded-full border border-[#7c4df1]/35 bg-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7c4df1]">
                    Professional Guidance
                  </span>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#1f2827] sm:text-3xl">
                    Looking For Expert Support?
                  </h3>
                  <p className="max-w-[460px] text-sm leading-relaxed text-[#5c6865]">
                    Connect with verified mental health experts for personalized guidance and evidence-based therapeutic support.
                  </p>
                </div>

                <Link
                  href="/therapists"
                  className="mt-8 flex w-full items-center justify-between rounded-full bg-[#7c4df1] py-3.5 px-5 text-sm font-bold text-white transition hover:bg-[#683cd7] shadow-[0_12px_28px_-8px_rgba(124,77,241,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 fill-current text-white/95" viewBox="0 0 24 24">
                      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.58 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-8h2v2h-2zm-3 0h2v2H8zm6 0h2v2h-2z" />
                    </svg>
                    <span>Find an Expert</span>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#7c4df1]">
                    <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </motion.article>
            </div>
          </div>

          {/* Peach trust ribbon footer */}
          <div className="mx-auto mt-10 max-w-[1240px] px-6 md:px-10">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-full border border-[#f7e0d2] bg-[#fbf1ea] px-8 py-3.5 text-xs font-semibold text-[#5c473c] shadow-xs">
              {/* Item 1: 100% Confidential */}
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-[#e07b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>100% Confidential</span>
              </div>

              {/* Separator */}
              <div className="hidden h-4 w-px bg-[#f7e0d2] md:block" />

              {/* Item 2: Anonymous Support */}
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-[#e07b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 00-4 4v2H4v2h16v-2h-4V8a4 4 0 00-4-4zM6 16v1a2 2 0 002 2h8a2 2 0 002-2v-1" />
                </svg>
                <span>Anonymous Support</span>
              </div>

              {/* Separator */}
              <div className="hidden h-4 w-px bg-[#f7e0d2] md:block" />

              {/* Item 3: 24/7 Availability */}
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-[#e07b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>24/7 Availability</span>
              </div>

              {/* Separator */}
              <div className="hidden h-4 w-px bg-[#f7e0d2] md:block" />

              {/* Item 4: Verified Experts */}
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-[#e07b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                </svg>
                <span>Verified Experts</span>
              </div>

              {/* Separator */}
              <div className="hidden h-4 w-px bg-[#f7e0d2] md:block" />

              {/* Item 5: Judgment-Free */}
              <div className="flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-[#e07b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Judgment-Free</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-white py-16 border-b border-black/5"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 text-center md:px-10">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826] sm:text-5xl">
              Verified Listeners
            </h2>
            <p className="mt-2 text-sm italic text-[#5c6865]">
              Matched by concern. Connected by understanding.
            </p>

            <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mt-10">
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrevListener}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e3ebd9] text-[#2f5d50] transition hover:bg-[#d5e0ca] active:scale-95 sm:h-16 sm:w-16 shadow-2xs"
                aria-label="Previous listener"
              >
                <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Central avatar and circles row */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-6 overflow-hidden py-4">
                {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                  const idx = (activeListenerIdx + offset + carouselListeners.length * 100) % carouselListeners.length;
                  const listener = carouselListeners[idx];
                  const isActive = offset === 0;

                  return (
                    <motion.div
                      key={listener.name}
                      layout
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      className={
                        isActive
                          ? "relative mx-1 h-24 w-24 shrink-0 rounded-full border-4 border-[#e3ebd9] bg-[#fdfdfd] shadow-md sm:mx-3 sm:h-28 sm:w-28 md:mx-4 md:h-32 md:w-32"
                          : "relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-[#51846b] border border-white/20 sm:h-12 sm:w-12 md:h-14 md:w-14"
                      }
                    >
                      <img
                        src={listener.image}
                        alt={listener.name}
                        className={`h-full w-full rounded-full object-cover transition-opacity duration-300 ${
                          isActive ? "opacity-100" : "opacity-35 grayscale"
                        }`}
                      />
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 flex h-6 w-6 -translate-x-1/2 translate-y-1/3 items-center justify-center rounded-full border-2 border-white bg-[#3f6a58] text-white shadow-xs">
                          <svg className="h-3.5 w-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextListener}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e3ebd9] text-[#2f5d50] transition hover:bg-[#d5e0ca] active:scale-95 sm:h-16 sm:w-16 shadow-2xs"
                aria-label="Next listener"
              >
                <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={openListenerBooking}
                className="rounded-lg bg-[#3f6a58] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#325647] shadow-[0_8px_20px_-6px_rgba(63,106,88,0.3)]"
              >
                Talk to a Listener
              </button>
            </div>
          </div>
        </motion.section>
        <motion.section
          className="bg-[#faf9f6] py-16 border-b border-black/5"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1360px] px-6 md:px-10">
            {/* Header with Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1c2826] sm:text-4xl">
                  Find the Right Experts
                </h2>
                <p className="mt-1 text-sm text-[#5c6865]">
                  Highly-rated experts matched to your profile.
                </p>
              </div>

              {/* Filter Button */}
              <div className="flex items-center gap-2 rounded-xl bg-[#eef1ed] border border-[#dce0db] px-4 py-2 text-xs font-semibold text-[#1c2826] shadow-2xs">
                <svg className="h-4 w-4 text-[#5c6865]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filter: <span className="font-bold text-[#2f5d50]">All experts</span></span>
              </div>
            </div>

            {/* Carousel Deck */}
            <div className="flex items-center gap-4 sm:gap-6 mt-10">
              {/* Left Arrow Button */}
              <button
                type="button"
                aria-label="Previous professionals"
                disabled={!canSlideProfessionals}
                onClick={() =>
                  setProSlide(
                    (prev) =>
                      (prev - 1 + featuredTherapists.length) % featuredTherapists.length,
                  )
                }
                className="grid h-12 w-12 shrink-0 place-content-center rounded-full bg-[#e3ebd9] text-[#2f5d50] hover:bg-[#d5e0ca] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
              >
                <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Grid content */}
              <div className="flex-1 min-w-0">
                {homeQuery.isLoading ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[340px] animate-pulse rounded-[24px] border border-[#dfdfdb] bg-white"
                      />
                    ))}
                  </div>
                ) : visibleProfessionals.length > 0 ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={proSlide}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                      {visibleProfessionals.map((provider, index) => (
                        <motion.article
                          key={`${provider.id}-${proSlide}-${index}`}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden rounded-xl border border-[#dfdfdb] bg-white shadow-xs flex flex-col justify-between"
                        >
                          <div className="relative h-[180px] w-full overflow-hidden bg-accent">
                            {provider.image ? (
                              <img
                                src={provider.image}
                                alt={provider.name ?? ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#bcead8] text-[#2f745f] font-bold text-xl">
                                {provider.name?.slice(0, 2).toUpperCase() ?? "TH"}
                              </div>
                            )}
                            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#1c2826] shadow-2xs">
                              {therapistTag(provider)}
                            </span>
                          </div>

                          <div className="pt-4 flex-1 flex flex-col justify-between">
                            <div className="px-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-sm font-bold uppercase tracking-tight text-[#1c2826] line-clamp-1">
                                    {provider.name ?? "Therapist"}
                                  </h3>
                                  <p className="text-[10px] font-medium text-[#5c6865] mt-0.5">
                                    1.5+ years of experience
                                  </p>
                                </div>
                                <div className="flex items-center gap-0.5 text-xs font-bold text-[#1c2826] shrink-0">
                                  <span className="text-[#e07b57]">★</span>
                                  <span>4.9</span>
                                </div>
                              </div>
                            </div>

                            {/* Dark Green Specializations Stripe */}
                            <div className="mt-4 bg-[#2f5d50] py-2 px-3 text-center">
                              <p className="text-[9px] font-semibold text-white truncate">
                                {provider.specializations.slice(0, 3).join(" • ") || "Wellness • Healing • Support"}
                              </p>
                            </div>

                            {/* Bottom Row */}
                            <div className="p-4 flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[#1c2826]">
                                {provider.hourlyRate
                                  ? `${formatCurrency(provider.hourlyRate)}/session`
                                  : "View pricing"}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  requireAuth(() =>
                                    router.push(`/dashboard/therapist/${provider.id}`),
                                  )
                                }
                                className="rounded-lg bg-[#2f5d50] hover:bg-[#204037] text-white text-[9px] font-bold tracking-wider px-3.5 py-2 uppercase transition shadow-2xs"
                              >
                                Book Session
                              </button>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <p className="text-sm text-[#687471]">
                    Verified therapists will appear here as they join the platform.
                  </p>
                )}
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                aria-label="Next professionals"
                disabled={!canSlideProfessionals}
                onClick={() =>
                  setProSlide((prev) => (prev + 1) % featuredTherapists.length)
                }
                className="grid h-12 w-12 shrink-0 place-content-center rounded-full bg-[#e3ebd9] text-[#2f5d50] hover:bg-[#d5e0ca] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
              >
                <svg className="h-6 w-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Bottom Match Actions */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/therapists"
                className="rounded-lg bg-[#2f5d50] hover:bg-[#204037] text-white text-xs font-bold px-8 py-3.5 tracking-wider uppercase transition shadow-xs"
              >
                View All Experts
              </Link>
              <Link
                href="/therapists"
                className="rounded-lg border-2 border-[#2f5d50] hover:bg-[#2f5d50]/5 text-[#2f5d50] text-xs font-bold px-8 py-3.5 tracking-wider uppercase transition"
              >
                Get Matched
              </Link>
            </div>
          </div>
        </motion.section>
        <motion.section
          className="bg-white py-20 border-b border-black/5"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10 text-center">
            <span className="inline-block rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2">
              COMMUNITY SPACE
            </span>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826] sm:text-5xl">
              Your Circle. Your Space. Your People.
            </h2>
            <p className="mt-2 text-sm italic text-[#5c6865]">
              A place to connect, express, reflect, and belong.
            </p>

            <div className="mt-12 grid gap-6">
              {/* Row 1: 3 equal columns */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Column 1: CLUBS */}
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl bg-[#f4faf6] border border-[#d5ebd9] p-8 text-left flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3 pr-20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2b624c]">
                      CLUBS
                    </h3>
                    <p className="text-sm font-semibold text-[#1c2826] leading-snug">
                      Join communities that match your interests and journey
                    </p>
                  </div>

                  {/* 3D abstract vector graphic */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-90">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="32" fill="#bcead8" fillOpacity="0.4" />
                      <circle cx="40" cy="30" r="12" fill="#2f745f" />
                      <path d="M16 60c0-10 16-14 24-14s24 4 24 14v4H16v-4z" fill="#2f745f" />
                      <circle cx="60" cy="26" r="8" fill="#5cb89a" />
                      <circle cx="20" cy="26" r="8" fill="#5cb89a" />
                    </svg>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <img className="h-5 w-5 rounded-full border border-white animate-pulse" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=80" alt="" />
                        <img className="h-5 w-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&q=80" alt="" />
                        <img className="h-5 w-5 rounded-full border border-white animate-pulse" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&q=80" alt="" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600">
                        {stats ? (stats.totalMembers >= 1000 ? `${Math.floor(stats.totalMembers / 1000)}K+` : stats.totalMembers) : "10K+"} Members
                      </span>
                    </div>

                    <Link
                      href="/clubs"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f745f] text-white hover:bg-[#1b4e3f] transition"
                    >
                      <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.article>

                {/* Column 2: APH EVENTS */}
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl bg-[#faf3f2] border border-[#eed6d4] p-8 text-left flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3 pr-20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#a6372d]">
                      APH EVENTS
                    </h3>
                    <p className="text-sm font-semibold text-[#1c2826] leading-snug">
                      Explore events, workshops & meetups to connect and grow.
                    </p>
                  </div>

                  {/* Calendar Graphic */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-90">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="15" y="20" width="50" height="50" rx="10" fill="#ffffff" stroke="#a6372d" strokeWidth="4" />
                      <rect x="15" y="20" width="50" height="15" rx="2" fill="#a6372d" />
                      <circle cx="28" cy="45" r="4" fill="#a6372d" />
                      <circle cx="40" cy="45" r="4" fill="#a6372d" />
                      <circle cx="52" cy="45" r="4" fill="#a6372d" />
                      <circle cx="28" cy="57" r="4" fill="#a6372d" />
                      <circle cx="40" cy="57" r="4" fill="#a6372d" />
                      <circle cx="52" cy="57" r="4" fill="#e57373" />
                      <rect x="23" y="12" width="6" height="12" rx="3" fill="#3f3f3f" />
                      <rect x="51" y="12" width="6" height="12" rx="3" fill="#3f3f3f" />
                    </svg>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <img className="h-5 w-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&q=80" alt="" />
                        <img className="h-5 w-5 rounded-full border border-white animate-pulse" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&q=80" alt="" />
                        <img className="h-5 w-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&q=80" alt="" />
                      </div>
                      <span className="text-[10px] font-bold text-[#a6372d]">
                        Upcoming Events
                      </span>
                    </div>

                    <Link
                      href="/events"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a6372d] text-white hover:bg-[#852a22] transition"
                    >
                      <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.article>

                {/* Column 3: JOURNAL */}
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl bg-[#f5f2fc] border border-[#e2daf7] p-8 text-left flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3 pr-20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#6f42c1]">
                      JOURNAL
                    </h3>
                    <p className="text-sm font-semibold text-[#1c2826] leading-snug">
                      A private space to reflect, write and understand yourself better.
                    </p>
                  </div>

                  {/* Journal Notebook SVG */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-90">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="15" width="44" height="54" rx="8" fill="#6f42c1" />
                      <rect x="16" y="20" width="8" height="6" rx="2" fill="#d0bdf4" />
                      <rect x="16" y="32" width="8" height="6" rx="2" fill="#d0bdf4" />
                      <rect x="16" y="44" width="8" height="6" rx="2" fill="#d0bdf4" />
                      <rect x="16" y="56" width="8" height="6" rx="2" fill="#d0bdf4" />
                      <path d="M42 32c-3-3-8 0-8 4c0 3 4 6 8 10c4-4 8-7 8-10c0-4-5-7-8-4z" fill="#ffffff" />
                    </svg>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#6f42c1]">
                      Reflect Daily
                    </span>

                    <button
                      type="button"
                      onClick={() => requireAuth(() => router.push("/dashboard/journal"))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6f42c1] text-white hover:bg-[#59339e] transition"
                    >
                      <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </motion.article>
              </div>

              {/* Row 2: 2 unequal columns */}
              <div className="grid gap-6 md:grid-cols-[1fr_1.8fr]">
                {/* Column 1: COMMUNITY BLOG */}
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl bg-[#f2f8fc] border border-[#d5e9f7] p-8 text-left flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3 pr-20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0c63e4]">
                      COMMUNITY BLOG
                    </h3>
                    <p className="text-sm font-semibold text-[#1c2826] leading-snug">
                      Read stories, insights and experiences shared by our community.
                    </p>
                  </div>

                  {/* Clipboard/Pencil SVG */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-90">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="15" width="40" height="50" rx="4" fill="#ffffff" stroke="#0c63e4" strokeWidth="4" />
                      <line x1="28" y1="28" x2="52" y2="28" stroke="#0c63e4" strokeWidth="3" strokeLinecap="round" />
                      <line x1="28" y1="38" x2="48" y2="38" stroke="#0c63e4" strokeWidth="3" strokeLinecap="round" />
                      <line x1="28" y1="48" x2="44" y2="48" stroke="#0c63e4" strokeWidth="3" strokeLinecap="round" />
                      <path d="M55 45 L68 25 L73 28 L60 48 Z" fill="#ffca28" />
                      <path d="M55 45 L52 48 L60 48 Z" fill="#3f3f3f" />
                    </svg>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0c63e4]">
                      Latest Stories
                    </span>

                    <Link
                      href="/blog"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c63e4] text-white hover:bg-[#0a4ec9] transition"
                    >
                      <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.article>

                {/* Column 2: SAFE CIRCLE */}
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl bg-[#fdf9e9] border border-[#f6ebd1] p-8 text-left flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3 pr-20 md:pr-40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#b08513]">
                      SAFE CIRCLE
                    </h3>
                    <p className="text-base font-semibold text-[#1c2826] leading-snug">
                      A safe & anonymous space to share, listen and support each other.
                    </p>
                  </div>

                  {/* Handholding circle vector silhouette */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-90 hidden md:block">
                    <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
                      <path d="M20 55 C20 30, 80 30, 80 55 C80 80, 20 80, 20 55" stroke="#b08513" strokeWidth="2" strokeDasharray="4 4" />
                      <circle cx="50" cy="30" r="6" fill="#b08513" />
                      <path d="M42 45 C42 37, 58 37, 58 45 L55 65 L45 65 Z" fill="#b08513" />
                      <circle cx="32" cy="45" r="6" fill="#b08513" />
                      <path d="M24 60 C24 52, 40 52, 40 60 L37 78 L27 78 Z" fill="#b08513" />
                      <circle cx="68" cy="45" r="6" fill="#b08513" />
                      <path d="M60 60 C60 52, 76 52, 76 60 L73 78 L63 78 Z" fill="#b08513" />
                    </svg>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-[#fcf5d2] px-2 py-0.5 text-[10px] font-bold text-[#b08513]">
                        Anonymous
                      </span>
                      <span className="rounded-md bg-[#fcf5d2] px-2 py-0.5 text-[10px] font-bold text-[#b08513]">
                        Respectful
                      </span>
                      <span className="rounded-md bg-[#fcf5d2] px-2 py-0.5 text-[10px] font-bold text-[#b08513]">
                        Supportive
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => requireAuth(() => router.push("/dashboard/safe-circle"))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b08513] text-white hover:bg-[#8f6a0d] transition"
                    >
                      <svg className="h-4.5 w-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </motion.article>
              </div>
            </div>

            {/* Bottom Community CTA Ribbon */}
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-6 rounded-full border border-[#c8dccb] bg-[#d7e6da] px-6 py-4 px-6 md:px-10 shadow-sm">
                <div className="flex items-center gap-4 text-left">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f4a39] shadow-2xs font-bold text-sm">
                    💚
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#1f4a39]">
                      Be a part of something meaningful.
                    </h4>
                    <p className="text-xs text-[#3d6e59] mt-0.5">
                      Real Conversations. Real support. Real connections.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openJoinModal}
                  className="rounded-full bg-white hover:bg-neutral-50 text-[#1f4a39] text-xs font-bold px-6 py-2.5 border border-[#c8dccb] shadow-2xs transition"
                >
                  Join our Community
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="events"
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-[1240px] gap-8 px-6 md:grid-cols-2 md:px-10">
            {upcomingEvents[0] ? (
              <article className="grid overflow-hidden rounded-[32px] bg-white shadow-[0_20px_42px_-35px_rgba(0,0,0,0.45)] md:grid-cols-[1fr_1.2fr]">
                <div
                  className="min-h-[280px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${upcomingEvents[0].image})` }}
                />
                <div className="p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#798682]">
                    {upcomingEvents[0].tag}
                  </p>
                  <h3 className="mt-2 text-[40px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                    {upcomingEvents[0].title}
                  </h3>
                  <p className="mt-4 text-[#63706d]">{upcomingEvents[0].description}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href={`/events/${upcomingEvents[0].id}`}
                      className="rounded-full bg-[#2f745f] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Reserve Spot
                    </Link>
                    <span className="text-xs font-semibold text-[#9ea5a3]">
                      Hosted by {upcomingEvents[0].host}
                    </span>
                  </div>
                </div>
              </article>
            ) : null}
            <article className="rounded-[32px] bg-white p-8 shadow-[0_20px_42px_-35px_rgba(0,0,0,0.45)]">
              <h3 className="text-[46px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                Calendar
              </h3>
              <div className="mt-6 space-y-4">
                {upcomingEvents.slice(1, 4).map((event) => {
                  const parts = event.tag.split("·").map((p) => p.trim());
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-4 rounded-2xl bg-[#f7f7f5] p-4 transition hover:bg-[#eef2ef]"
                    >
                      <div className="rounded-xl bg-[#bcead8] px-3 py-2 text-center">
                        <p className="text-xs font-semibold uppercase leading-tight text-[#2f745f]">
                          {parts[0] ?? "Event"}
                        </p>
                        <p className="text-xl font-bold text-[#2f745f]">{parts[1] ?? ""}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1f2827]">{event.title}</p>
                        <p className="text-sm text-[#697572]">{event.host}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link href="/events" className="mt-4 inline-block text-sm font-semibold text-[#2f745f]">
                View all events →
              </Link>
            </article>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Voices of The Sanctuary
            </h2>
            <div className="mt-8 grid max-h-[360px] gap-4 overflow-hidden md:grid-cols-3">
              {voiceColumns.map((column, columnIndex) => {
                const columnItems = [...column, ...column];
                const movePattern =
                  columnIndex === 1 ? ["-50%", "0%"] : ["0%", "-50%"];
                return (
                  <motion.div
                    key={columnIndex}
                    className="flex flex-col gap-4"
                    animate={{ y: movePattern }}
                    transition={{
                      duration: 14 + columnIndex * 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    {columnItems.map((quote, index) => (
                      <article
                        key={`${quote}-${index}`}
                        className={`rounded-[18px] p-5 ${
                          columnIndex === 1 && index % 2 === 0
                            ? "bg-[#bcead8]"
                            : "bg-[#f0f0ed]"
                        }`}
                      >
                        <p className="text-sm italic text-[#5f6d6a]">{quote}</p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#2b3c39]">
                          User {columnIndex + 1}
                        </p>
                      </article>
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Gentle Answers
            </h2>
            <div className="mt-8 space-y-4">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.question}
                    className="rounded-2xl bg-white px-5 py-4 shadow-[0_16px_30px_-28px_rgba(0,0,0,0.5)]"
                  >
                    <button
                      className="flex w-full items-center justify-between gap-4 text-left text-sm font-semibold text-[#273331]"
                      onClick={() =>
                        setOpenFaqIndex((current) =>
                          current === idx ? -1 : idx,
                        )
                      }
                    >
                      <span>{item.question}</span>
                      <span
                        className={`text-xl leading-none transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden pt-3 text-sm text-[#6b7674]"
                        >
                          {item.answer}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-6 pb-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] rounded-[38px] bg-[#2f745f] p-10 md:p-14">
            <h2 className="text-[52px] font-semibold tracking-[-0.02em] text-white">
              Become a part of ApnaHealer
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [
                  "Be a Listener",
                  "Lend your heart and time to support others in need.",
                  "Apply Now",
                ],
                [
                  "Join as Therapist",
                  "Grow your clinical practice within our mindful ecosystem.",
                  "Register",
                ],
                [
                  "Organizations",
                  "Bring mental wellness to your team or institution.",
                  "Partner",
                ],
              ].map(([title, copy, action]) => (
                <motion.article
                  key={title}
                  className="rounded-2xl border border-white/20 bg-white/10 p-6"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm text-white/85">{copy}</p>
                  <button className="mt-5 rounded-full bg-[#d5e8df] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f745f]">
                    {action}
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
      <LandingJoinModal
        open={isJoinModalOpen}
        onClose={closeJoinModal}
        modalMethod={modalMethod}
        onModalMethodChange={(method) => {
          setModalMethod(method);
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
        onPhoneSubmit={handlePhoneSubmit}
        onOtpSubmit={handleOtpSubmit}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f4f2]" aria-busy="true" aria-label="Loading" />
      }
    >
      <HomePage />
    </Suspense>
  );
}
