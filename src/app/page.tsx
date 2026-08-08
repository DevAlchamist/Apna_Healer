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
import { LandingNavbar } from "@/components/landing/navbar";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { useListenerSupportModal } from "@/components/dashboard/listener-support-modal";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiPublicClubSummary, ApiPublicHomeBundle, ApiProvider } from "@/types/api";
import {
  ArrowRightIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  LockIcon,
  EyeOffIcon,
  ClockIcon,
  HeartIcon,
  BadgeCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  StarIcon,
  LanguagesIcon,
  UsersIcon,
  CalendarDaysIcon,
  CheckIcon,
  QuoteIcon,
  PlusIcon,
  HeartHandshakeIcon,
} from "lucide-react";

// ==========================================
// STATIC/TEMPLATE DATA CONSTANTS
// ==========================================

const heroSlides = [
  {
    id: "slide-listen",
    eyebrow: "You are not alone in this",
    title: "Someone is ready to",
    highlight: "simply listen",
    body: "No forms to fill, no diagnosis, no judgment. Talk to a trained peer listener within minutes — anonymously, whenever it feels heavy.",
    image: "/fbdca7fe-2733-4317-8c9e-00aba2767d1f.jpg",
    imageAlt: "Soft overlapping sage, lavender and peach shapes on a cream background",
    primaryCta: "Talk to a listener",
    secondaryCta: "How it works",
    accent: "sage" as const,
  },
  {
    id: "slide-guidance",
    eyebrow: "Professional guidance",
    title: "Therapy that feels",
    highlight: "gentle, not clinical",
    body: "Verified psychologists and counsellors who speak your language — literally. Book a 50-minute session at a time that fits your life.",
    image: "/aaef0ed6-bf9f-449b-be2a-b601b778ea81.jpg",
    imageAlt: "Two people sitting together in soft sunlight having a calm conversation",
    primaryCta: "Find your therapist",
    secondaryCta: "Browse experts",
    accent: "lavender" as const,
  },
  {
    id: "slide-community",
    eyebrow: "Community circles",
    title: "Healing is lighter",
    highlight: "when it is shared",
    body: "Join small, moderated circles for anxiety, work stress, heartbreak or new beginnings. Show up as much or as little as you want.",
    image: "/d7599569-3c15-440b-9556-b602a2ed91be.jpg",
    imageAlt: "A cup of herbal tea and eucalyptus sprig on a cream surface in soft light",
    primaryCta: "Explore circles",
    secondaryCta: "See member stories",
    accent: "peach" as const,
  },
];

const accentRing: Record<string, string> = {
  sage: "bg-sage-500",
  lavender: "bg-lavender-500",
  peach: "bg-peach-400",
};

const accentButton: Record<string, string> = {
  sage: "bg-sage-600 hover:bg-sage-700 focus:ring-sage-500",
  lavender: "bg-lavender-600 hover:bg-lavender-700 focus:ring-lavender-500",
  peach: "bg-peach-500 hover:bg-peach-600 focus:ring-peach-400",
};

const accentText: Record<string, string> = {
  sage: "text-sage-600",
  lavender: "text-lavender-600",
  peach: "text-peach-600",
};

const serviceMatchCards = [
  {
    key: "peer",
    icon: HeartHandshakeIcon,
    label: "Peer support",
    price: "Always free",
    title: "I just want someone to listen",
    body: "Trained peer listeners who have been through it too. Anonymous chat or voice, no appointment, no clock ticking.",
    points: ["Available in under 5 minutes", "Completely anonymous", "Unlimited conversations", "No diagnosis, no advice unless asked"],
    cta: "Talk to a listener",
    wrap: "bg-sage-50 border-sage-100",
    glow: "bg-[radial-gradient(circle_at_center,rgba(169,200,160,0.45),transparent_65%)]",
    iconWrap: "bg-sage-500 text-cream-50",
    chip: "bg-sage-100 text-sage-700",
    button: "bg-sage-600 hover:bg-sage-700",
    tick: "text-sage-600",
  },
  {
    key: "professional",
    icon: ClockIcon, // matches template generic medical icon replacement
    label: "Professional guidance",
    price: "From ₹850 / session",
    title: "I’m ready to work with an expert",
    body: "Verified psychologists, counsellors and psychiatrists for structured therapy. Choose by specialty, language and price.",
    points: ["Licence-verified professionals", "50-minute private sessions", "Switch anytime, no awkwardness", "Free cancellation up to 4 hrs"],
    cta: "Browse experts",
    wrap: "bg-lavender-50 border-lavender-100",
    glow: "bg-[radial-gradient(circle_at_center,rgba(192,178,229,0.45),transparent_65%)]",
    iconWrap: "bg-lavender-500 text-cream-50",
    chip: "bg-lavender-100 text-lavender-700",
    button: "bg-lavender-600 hover:bg-lavender-700",
    tick: "text-lavender-600",
  },
];

const promiseItems = [
  { label: "100% Confidential", icon: LockIcon },
  { label: "Anonymous Support", icon: EyeOffIcon },
  { label: "24/7 Availability", icon: ClockIcon },
  { label: "Verified Experts", icon: ShieldCheckIcon },
  { label: "Judgment-Free", icon: HeartIcon },
];

const circleAccents = {
  sage: { wrap: "hover:border-sage-200", chip: "bg-sage-100 text-sage-700", glow: "bg-sage-200/50", btn: "bg-sage-600 hover:bg-sage-700" },
  lavender: { wrap: "hover:border-lavender-200", chip: "bg-lavender-100 text-lavender-700", glow: "bg-lavender-200/50", btn: "bg-lavender-600 hover:bg-lavender-700" },
  peach: { wrap: "hover:border-peach-200", chip: "bg-peach-100 text-peach-600", glow: "bg-peach-200/50", btn: "bg-peach-500 hover:bg-peach-600" },
};

const fallbackFaqItems = [
  {
    id: "f-1",
    question: "Is my conversation really anonymous?",
    answer: "Yes. You choose a display name when you join, and listeners never see your phone number, email or real identity. Chats are end-to-end encrypted and you can delete your history at any time from your dashboard.",
  },
  {
    id: "f-2",
    question: "What is the difference between a peer listener and a therapist?",
    answer: "Peer listeners are trained volunteers who offer free, judgment-free emotional support — they listen rather than diagnose. Therapists and psychiatrists are verified licensed professionals who provide structured, paid sessions with clinical treatment plans.",
  },
  {
    id: "f-3",
    question: "How much does it cost?",
    answer: "Peer support and community circles are completely free, always. Professional sessions start at ₹850 for 50 minutes, and every expert lists their price upfront — no packages, no hidden fees, cancel up to 4 hours before.",
  },
  {
    id: "f-4",
    question: "How are listeners and experts verified?",
    answer: "Every listener completes a 30-hour active-listening programme, a background check and a supervised trial period. Professionals are verified against RCI / medical council registration, degrees and practice history before they appear on Apna Healer.",
  },
  {
    id: "f-5",
    question: "What if I am in crisis right now?",
    answer: "If you are in immediate danger, please call your local emergency number or the Tele-MANAS helpline at 14416 right away. Inside Apna Healer, tap “Urgent support” in any chat and a senior crisis-trained responder joins within 60 seconds.",
  },
  {
    id: "f-6",
    question: "Can I switch to a different listener or therapist?",
    answer: "Anytime, with no explanation needed. Fit matters more than loyalty — tap “Find someone else” in your dashboard and we will match you again while keeping your notes and preferences.",
  },
];

const fallbackTestimonials = [
  {
    id: "r-1",
    quote: "I opened the app at 1 AM expecting nobody. A listener replied in two minutes and just let me talk for an hour. No advice, no fixing. That was exactly what I needed.",
    author: "Anonymous member",
    context: "Peer support · 4 months in",
    initials: "AM",
    accent: "sage" as const,
    rating: 5,
  },
  {
    id: "r-2",
    quote: "Therapy always felt like something for “serious” problems. Booking here felt as simple as booking a haircut, and my therapist speaks Marathi with me.",
    author: "Sneha P.",
    context: "Professional guidance",
    initials: "SP",
    accent: "lavender" as const,
    rating: 5,
  },
  {
    id: "r-3",
    quote: "The anonymity is what got me to type the first message. Nobody in my family knows, and I finally have somewhere to put all of it down.",
    author: "Anonymous member",
    context: "Peer support · 1 year in",
    initials: "AN",
    accent: "peach" as const,
    rating: 5,
  },
  {
    id: "r-4",
    quote: "My circle of eight people meets every Tuesday. Hearing someone describe my exact 3 AM thoughts out loud was strangely healing.",
    author: "Rahul V.",
    context: "Quiet Anxiety Club",
    initials: "RV",
    accent: "lavender" as const,
    rating: 5,
  },
  {
    id: "r-5",
    quote: "I have switched therapists twice here without any awkwardness. Being allowed to find the right fit made me stay in therapy at all.",
    author: "Meera J.",
    context: "Professional guidance · 7 sessions",
    initials: "MJ",
    accent: "sage" as const,
    rating: 4,
  },
  {
    id: "r-6",
    quote: "It never feels like a hospital. Soft colours, kind words, no one asking me to “stay positive”. I actually look forward to opening it.",
    author: "Anonymous member",
    context: "Community circles",
    initials: "AH",
    accent: "peach" as const,
    rating: 5,
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

// ==========================================
// SUB-COMPONENTS DECLARATIONS
// ==========================================

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
}

function SectionHeading({ eyebrow, title, description, align = "center", action }: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col gap-6 ${
        isCenter ? "items-center text-center" : "items-start sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={isCenter ? "max-w-2xl" : "max-w-xl"}>
        <span className="inline-flex items-center rounded-full bg-cream-200 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
          {eyebrow}
        </span>
        <h2 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">{title}</h2>
        {description && <p className="mt-4 text-base leading-relaxed text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

interface AvatarProps {
  initials: string;
  accent: "sage" | "lavender" | "peach";
  size?: "sm" | "md" | "lg";
  online?: boolean;
  label?: string;
}

const avatarAccents = {
  sage: "bg-sage-100 text-sage-700 ring-sage-200",
  lavender: "bg-lavender-100 text-lavender-700 ring-lavender-200",
  peach: "bg-peach-100 text-peach-600 ring-peach-200",
};

const avatarSizes = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-base",
};

function Avatar({ initials, accent, size = "md", online, label }: AvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        aria-hidden={label ? undefined : true}
        aria-label={label}
        className={`inline-flex items-center justify-center rounded-full font-semibold ring-1 ${avatarAccents[accent]} ${avatarSizes[size]}`}
      >
        {initials}
      </span>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cream-50">
          <span className="h-2.5 w-2.5 rounded-full bg-sage-500" />
        </span>
      )}
    </span>
  );
}

// ==========================================
// MAIN HOMEPAGE COMPONENT
// ==========================================

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const { open: openBookSession } = useBookSessionModal();
  const { open: openListenerSupport } = useListenerSupportModal();
  const pendingBookingRef = useRef<"therapist" | "listener" | null>(null);
  const pendingTherapistRef = useRef<ApiProvider | null>(null);

  // APIs data fetching
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
  const featuredTherapists = home?.featuredTherapists ?? [];
  const faqItems = home?.faq?.length ? home.faq.map((f, i) => ({ id: `f-${i}`, ...f })) : fallbackFaqItems;
  const testimonials = home?.testimonials?.length
    ? home.testimonials.map((t, i) => ({
        id: `t-${i}`,
        quote: t,
        author: "Anonymous member",
        context: "Sanctuary member",
        initials: "AM",
        accent: (["sage", "lavender", "peach"][i % 3]) as "sage" | "lavender" | "peach",
        rating: 5,
      }))
    : fallbackTestimonials;

  // Active slide States
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPlaying, setHeroPlaying] = useState(true);
  const [joinedCircleIds, setJoinedCircleIds] = useState<string[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqItems[0]?.id || "f-1");

  // Track scrolling references
  const listenerTrackRef = useRef<HTMLDivElement>(null);
  const therapistTrackRef = useRef<HTMLDivElement>(null);

  const scrollListeners = (dir: 1 | -1) => {
    listenerTrackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const scrollTherapists = (dir: 1 | -1) => {
    therapistTrackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  // Slideshow timer
  useEffect(() => {
    if (!heroPlaying) return;
    const t = window.setInterval(() => setHeroIndex((i) => (i + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(t);
  }, [heroPlaying]);

  // Modal lifecycle & redirection
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  const openTherapistBooking = useCallback((provider?: ApiProvider) => {
    if (status !== "authenticated") {
      pendingBookingRef.current = "therapist";
      pendingTherapistRef.current = provider || null;
      openJoinModal();
      return;
    }
    if (provider) {
      openBookSession({
        providerId: provider.id,
        name: provider.name ?? undefined,
        specialty: provider.specializations[0] ?? "Therapist",
        imageSrc: provider.image,
        preferredRole: "THERAPIST",
      });
    } else {
      openBookSession({ preferredRole: "THERAPIST" });
    }
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
      const provider = pendingTherapistRef.current;
      pendingTherapistRef.current = null;
      if (provider) {
        openBookSession({
          providerId: provider.id,
          name: provider.name ?? undefined,
          specialty: provider.specializations[0] ?? "Therapist",
          imageSrc: provider.image,
          preferredRole: "THERAPIST",
        });
      } else {
        openBookSession({ preferredRole: "THERAPIST" });
      }
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

  // MAPPED DYNAMIC DATA HOOKS
  const mappedListeners = useMemo(() => {
    if (home?.listeners && home.listeners.length > 0) {
      return home.listeners.map((l, i) => ({
        id: l.id,
        name: l.name || "Anonymous Listener",
        initials: (l.name || "Anonymous").trim().slice(0, 2).toUpperCase(),
        accent: (["sage", "lavender", "peach"][i % 3]) as "sage" | "lavender" | "peach",
        languages: l.languages || ["English", "Hindi"],
        focus: l.specializations?.[0] || "Peer Support",
        isOnline: true,
        conversations: Math.floor(Math.random() * 200) + 120,
        rating: 4.8 + Math.random() * 0.2,
      }));
    }
    return [
      { id: "l-1", name: "Aarav", initials: "AA", accent: "sage" as const, languages: ["Hindi", "English"], focus: "Work stress", isOnline: true, conversations: 412, rating: 4.9 },
      { id: "l-2", name: "Meher", initials: "ME", accent: "lavender" as const, languages: ["English", "Urdu"], focus: "Anxiety", isOnline: true, conversations: 268, rating: 4.8 },
      { id: "l-3", name: "Kabir", initials: "KA", accent: "peach" as const, languages: ["Hindi", "Punjabi"], focus: "Loneliness", isOnline: true, conversations: 531, rating: 5.0 },
      { id: "l-4", name: "Ishita", initials: "IS", accent: "sage" as const, languages: ["English", "Bengali"], focus: "Heartbreak", isOnline: true, conversations: 189, rating: 4.9 },
      { id: "l-5", name: "Rehan", initials: "RE", accent: "lavender" as const, languages: ["Hindi", "English"], focus: "Exam pressure", isOnline: true, conversations: 344, rating: 4.7 },
      { id: "l-6", name: "Tanvi", initials: "TA", accent: "peach" as const, languages: ["Marathi", "English"], focus: "Family conflict", isOnline: true, conversations: 297, rating: 4.9 },
    ];
  }, [home?.listeners]);

  const onlineMarqueeList = useMemo(() => {
    const list = mappedListeners.filter((l) => l.isOnline);
    return [...list, ...list];
  }, [mappedListeners]);

  const mappedTherapists = useMemo(() => {
    if (featuredTherapists && featuredTherapists.length > 0) {
      return featuredTherapists.map((t, i) => ({
        id: t.id,
        name: t.name || "Therapist",
        photo: t.image || "/1b305101-e75d-4490-a94e-f2cff0113199.jpg",
        credential: t.specializations?.[0] || "Counselling Psychologist",
        specialties: t.specializations.slice(0, 3) || ["Counselling", "Therapy"],
        rating: 4.8 + Math.random() * 0.2,
        reviews: Math.floor(Math.random() * 100) + 45,
        experience: "5+ yrs",
        price: t.hourlyRate || 850,
        languages: t.languages || ["English", "Hindi"],
        nextSlot: "Today, 6:30 PM",
        originalProvider: t,
      }));
    }
    return [
      { id: "t-1", name: "Dr. Anaya Kulkarni", photo: "/2d19585d-dde1-4449-b1c2-34e410cbfbf2.jpg", credential: "Clinical Psychologist, RCI", specialties: ["Anxiety", "Trauma", "CBT"], rating: 4.9, reviews: 214, experience: "11 yrs", price: 1200, languages: ["English", "Hindi", "Marathi"], nextSlot: "Today, 6:30 PM", originalProvider: undefined },
      { id: "t-2", name: "Dr. Imran Sheikh", photo: "/1d3367b5-61c9-4648-bb01-3fa4d7309727.jpg", credential: "Counselling Psychologist", specialties: ["Depression", "Men’s mental health"], rating: 4.8, reviews: 168, experience: "9 yrs", price: 1000, languages: ["English", "Hindi", "Urdu"], nextSlot: "Tomorrow, 11:00 AM", originalProvider: undefined },
      { id: "t-3", name: "Riya Menon", photo: "/1b305101-e75d-4490-a94e-f2cff0113199.jpg", credential: "Therapist, M.Phil Psychology", specialties: ["Relationships", "Self-esteem"], rating: 4.9, reviews: 143, experience: "6 yrs", price: 850, languages: ["English", "Malayalam"], nextSlot: "Today, 9:00 PM", originalProvider: undefined },
      { id: "t-4", name: "Arjun Bhatia", photo: "/292ce2e8-864f-4b45-b3ba-61b0e5385673.jpg", credential: "Career & Life Coach, ICF", specialties: ["Burnout", "Work stress"], rating: 4.7, reviews: 121, experience: "7 yrs", price: 900, languages: ["English", "Hindi", "Punjabi"], nextSlot: "Tomorrow, 4:15 PM", originalProvider: undefined },
    ];
  }, [featuredTherapists]);

  const mappedCircles = useMemo(() => {
    if (publicClubs && publicClubs.length > 0) {
      return publicClubs.map((club, i) => ({
        id: club.id,
        name: club.title,
        tagline: club.subtitle || "A supportive small community group.",
        members: club.activeMembers || 1500,
        cadence: club.weeklyEvents || "Weekly moderated audio threads",
        accent: (["sage", "lavender", "peach"][i % 3]) as "sage" | "lavender" | "peach",
        tags: [club.sphere || "Community"],
      }));
    }
    return [
      { id: "c-1", name: "Quiet Anxiety Club", tagline: "For the 2 AM overthinkers. Breathe, share, and let it settle.", members: 2840, cadence: "Live circle every Tue, 9 PM", accent: "sage" as const, tags: ["Anxiety", "Beginner friendly"] },
      { id: "c-2", name: "Work In Progress", tagline: "Burnout, bad managers and boundaries — vent without the LinkedIn voice.", members: 1962, cadence: "Weekly prompt + open thread", accent: "lavender" as const, tags: ["Burnout", "Career"] },
      { id: "c-3", name: "After The Goodbye", tagline: "A gentle space for heartbreak, endings and slowly starting again.", members: 1204, cadence: "Live circle every Sat, 7 PM", accent: "peach" as const, tags: ["Heartbreak", "Grief"] },
    ];
  }, [publicClubs]);

  const slide = heroSlides[heroIndex];

  const handleCircleToggle = (id: string) => {
    if (status !== "authenticated") {
      openJoinModal();
      return;
    }
    setJoinedCircleIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full bg-cream-100 text-ink-900 font-sans">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main>
        {/* ==========================================
            SECTION 1: HERO CAROUSEL
            ========================================== */}
        <section id="top" aria-label="Welcome to Apna Healer" className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.55),transparent_65%)]" />
            <div className="absolute -right-24 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.5),transparent_65%)]" />
            <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.45),transparent_65%)]" />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50/80 px-4 py-2 text-xs font-semibold text-ink-500 backdrop-blur">
                    <span className={`h-1.5 w-1.5 rounded-full ${accentRing[slide.accent]}`} />
                    {slide.eyebrow}
                  </span>
                  <h1 className="mt-6 font-display text-4xl leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.65rem] font-semibold">
                    {slide.title}{" "}
                    <span className={`italic ${accentText[slide.accent]}`}>{slide.highlight}</span>
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">{slide.body}</p>

                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={slide.id === "slide-listen" ? openListenerBooking : () => scrollToSection("experts")}
                      className={`group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-cream-50 shadow-soft transition cursor-pointer ${
                        accentButton[slide.accent]
                      }`}
                    >
                      {slide.primaryCta}
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection(slide.id === "slide-community" ? "circles" : "services")}
                      className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50/70 px-7 py-4 text-sm font-semibold text-ink-700 backdrop-blur transition hover:border-ink-400/40 hover:bg-cream-50 cursor-pointer"
                    >
                      {slide.secondaryCta}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
                  {heroSlides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === heroIndex}
                      aria-label={`Slide ${i + 1}: ${s.eyebrow}`}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                        i === heroIndex ? "w-10 bg-ink-900" : "w-4 bg-ink-400/40 hover:bg-ink-400/70"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHeroPlaying((p) => !p)}
                  aria-label={heroPlaying ? "Pause slideshow" : "Play slideshow"}
                  className="rounded-full border border-cream-300 p-2 text-ink-500 transition hover:bg-cream-200 hover:text-ink-900 cursor-pointer"
                >
                  {heroPlaying ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
                </button>
                <span className="flex items-center gap-1.5 text-xs text-ink-400">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-sage-500" />
                  12,400+ conversations held this month
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-5xl bg-cream-200 shadow-soft">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={slide.id}
                    src={slide.image}
                    alt={slide.imageAlt}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-3xl border border-cream-300 bg-cream-50/90 px-5 py-4 shadow-soft backdrop-blur sm:left-8"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-700">
                  4m
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Average wait time</p>
                  <p className="text-xs text-ink-400">To be heard by a real person</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 2: LISTENERS ONLINE MARQUEE
            ========================================== */}
        <section aria-label="Peer listeners currently online" className="border-y border-cream-300 bg-cream-100/70 py-4 overflow-hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 sm:px-8">
            <p className="hidden shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
              </span>
              {mappedListeners.filter((l) => l.isOnline).length} online now
            </p>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex w-max animate-marquee items-center gap-3">
                {onlineMarqueeList.map((l, i) => (
                  <span
                    key={`${l.id}-${i}`}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-xs text-ink-500 font-medium"
                    aria-hidden={i >= mappedListeners.length ? true : undefined}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${accentRing[l.accent]}`} />
                    <span className="font-semibold text-ink-900">{l.name}</span>
                    <span className="text-ink-400">·</span>
                    {l.focus}
                    <span className="text-ink-400">·</span>
                    {l.languages.join("/")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 3: SERVICE MATCH CARDS
            ========================================== */}
        <section id="services" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Two ways in"
            title="What would feel right, right now?"
            description="There is no wrong door. Start with a free conversation, or go straight to a professional — you can move between the two whenever you like."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {serviceMatchCards.map((card, i) => (
              <motion.article
                key={card.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-4xl border p-8 transition-shadow duration-300 hover:shadow-soft sm:p-10 ${card.wrap}`}
              >
                <div aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full ${card.glow}`} />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconWrap}`}>
                      <card.icon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${card.chip}`}>{card.price}</span>
                  </div>

                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{card.label}</p>
                  <h3 className="mt-2 font-display text-2xl leading-snug text-ink-900 sm:text-[1.75rem] font-semibold">{card.title}</h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">{card.body}</p>

                  <ul className="mt-7 space-y-3">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-ink-700 font-semibold">
                        <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${card.tick}`} />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={card.key === "peer" ? openListenerBooking : () => scrollToSection("experts")}
                    className={`mt-9 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-cream-50 transition cursor-pointer ${card.button}`}
                  >
                    {card.cta}
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION 4: TRUST RIBBON
            ========================================== */}
        <section aria-label="Our promises to you" className="bg-peach-100/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-7 sm:px-8">
            {promiseItems.map((item, i) => (
              <motion.span
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="flex items-center gap-2.5 text-sm font-semibold text-peach-600"
              >
                <item.icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="text-ink-700">{item.label}</span>
              </motion.span>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION 5: VERIFIED LISTENERS CAROUSEL
            ========================================== */}
        <section id="listeners" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionHeading
            align="left"
            eyebrow="Verified listeners"
            title="Real people, trained to hold space"
            description="Every listener completes 30 hours of active-listening training and a supervised trial. They stay anonymous too — first names only."
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scrollListeners(-1)}
                  aria-label="Previous listeners"
                  className="rounded-full border border-cream-300 bg-cream-50/80 p-3 text-ink-500 transition hover:border-sage-200 hover:text-ink-900 cursor-pointer"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollListeners(1)}
                  aria-label="More listeners"
                  className="rounded-full border border-cream-300 bg-cream-50/80 p-3 text-ink-500 transition hover:border-sage-200 hover:text-ink-900 cursor-pointer"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            }
          />

          <div
            ref={listenerTrackRef}
            className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth"
            role="list"
            aria-label="Verified peer listeners"
          >
            {mappedListeners.map((listener, i) => (
              <motion.div
                key={listener.id}
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06 }}
                className="w-[228px] shrink-0 snap-start rounded-4xl border border-cream-300 bg-cream-50 p-6 text-center transition hover:shadow-soft"
              >
                <div className="flex justify-center">
                  <Avatar initials={listener.initials} accent={listener.accent} size="lg" online={listener.isOnline} />
                </div>
                <p className="mt-4 flex items-center justify-center gap-1.5 font-display text-lg text-ink-900 font-semibold">
                  {listener.name}
                  <BadgeCheckIcon className="h-4 w-4 text-sage-500" aria-label="Verified listener" />
                </p>
                <p className="mt-1 text-xs text-ink-400">{listener.languages.join(" · ")}</p>
                <span className="mt-3 inline-block rounded-full bg-cream-200 px-3 py-1.5 text-[11px] font-semibold text-ink-500">
                  {listener.focus}
                </span>
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-ink-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <StarIcon className="h-3.5 w-3.5 fill-peach-400 text-peach-400" />
                    {listener.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircleIcon className="h-3.5 w-3.5" />
                    {listener.conversations}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openListenerBooking}
                  disabled={!listener.isOnline}
                  className={`mt-5 w-full rounded-full px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    listener.isOnline ? "bg-sage-100 text-sage-700 hover:bg-sage-200" : "cursor-not-allowed bg-cream-200 text-ink-400"
                  }`}
                >
                  {listener.isOnline ? "Say hi" : "Away right now"}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION 6: VERIFIED EXPERTS CAROUSEL
            ========================================== */}
        <section id="experts" className="relative overflow-hidden bg-[#ece7f8]/40 py-20 lg:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.65),transparent_65%)]"
          />

          <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
            <SectionHeading
              align="left"
              eyebrow="Verified experts"
              title="Therapists who feel like people first"
              description="Licence-verified psychologists, counsellors and psychiatrists. Transparent pricing, no packages, and you can switch whenever the fit isn’t right."
              action={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => scrollTherapists(-1)}
                    aria-label="Previous experts"
                    className="rounded-full border border-lavender-200 bg-cream-50 p-3 text-ink-500 transition hover:border-lavender-300 hover:text-ink-900 cursor-pointer"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTherapists(1)}
                    aria-label="More experts"
                    className="rounded-full border border-lavender-200 bg-cream-50 p-3 text-ink-500 transition hover:border-lavender-300 hover:text-ink-900 cursor-pointer"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              }
            />

            <div
              ref={therapistTrackRef}
              className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scroll-smooth"
              role="list"
              aria-label="Verified therapists and experts"
            >
              {mappedTherapists.map((t, i) => (
                <motion.article
                  key={t.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: Math.min(i, 4) * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="flex w-[292px] shrink-0 snap-start flex-col rounded-4xl border border-lavender-100 bg-cream-50 p-5 transition-shadow hover:shadow-soft"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-cream-200">
                    <img
                      src={t.photo}
                      alt={`Portrait of ${t.name}`}
                      className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3 py-1.5 text-[11px] font-semibold text-lavender-700 backdrop-blur">
                      <BadgeCheckIcon className="h-3.5 w-3.5" />
                      Verified
                    </span>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-cream-50/90 px-3 py-1.5 text-[11px] font-semibold text-ink-700 backdrop-blur">
                      <StarIcon className="h-3.5 w-3.5 fill-peach-400 text-peach-400" />
                      {t.rating.toFixed(1)} ({t.reviews})
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <h3 className="font-display text-lg leading-snug text-ink-900 font-semibold">{t.name}</h3>
                    <p className="mt-1 text-xs text-ink-500 font-medium">
                      {t.credential} · {t.experience}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-lavender-100 px-2.5 py-1 text-[11px] text-lavender-700 font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400 font-semibold">
                      <LanguagesIcon className="h-3.5 w-3.5" />
                      {t.languages.join(", ")}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-sage-600 font-semibold">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Next slot · {t.nextSlot}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-cream-300 pt-4">
                    <div>
                      <p className="font-display text-lg text-ink-900 font-bold">{typeof t.price === "number" ? `₹${t.price}` : t.price}</p>
                      <p className="text-[11px] text-ink-400">50 min session</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openTherapistBooking(t.originalProvider)}
                      className="rounded-full bg-lavender-600 px-5 py-2.5 text-xs font-semibold text-cream-50 transition hover:bg-lavender-700 cursor-pointer"
                    >
                      Book session
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 7: COMMUNITY CIRCLES
            ========================================== */}
        <section id="circles" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Community circles"
            title="Small circles, moderated with care"
            description="Find your people around what you’re actually going through. Every circle is capped, moderated and free to leave — lurking is completely allowed."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mappedCircles.map((circle, i) => {
              const a = circleAccents[circle.accent];
              const isJoined = joinedCircleIds.includes(circle.id);
              return (
                <motion.article
                  key={circle.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  whileHover={{ y: -4 }}
                  className={`group relative flex flex-col overflow-hidden rounded-4xl border border-cream-300 bg-cream-50 p-7 transition-all duration-300 hover:shadow-soft ${a.wrap}`}
                >
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-2xl transition-opacity duration-500 ${a.glow} opacity-0 group-hover:opacity-100`}
                  />

                  <div className="relative flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {circle.tags.map((tag) => (
                        <span key={tag} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.chip}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-5 font-display text-xl leading-snug text-ink-900 font-semibold">{circle.name}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{circle.tagline}</p>

                    <div className="mt-5 space-y-2 text-xs text-ink-400 font-semibold">
                      <p className="flex items-center gap-2">
                        <UsersIcon className="h-3.5 w-3.5" />
                        {circle.members.toLocaleString("en-IN")} members
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                        {circle.cadence}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCircleToggle(circle.id)}
                    aria-pressed={isJoined}
                    className={`relative mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition cursor-pointer ${
                      isJoined ? "bg-cream-200 text-ink-700 hover:bg-cream-300" : `text-cream-50 ${a.btn}`
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-sage-600" />
                        You’re in
                      </>
                    ) : (
                      "Join circle"
                    )}
                  </button>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            SECTION 8: MEMBER STORIES (TESTIMONIALS)
            ========================================== */}
        <section id="stories" className="bg-cream-100/80 py-20 lg:py-28">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Member stories"
              title="Shared with permission, kept anonymous"
              description="Some members choose to share their first name, most don’t. Either way, these are real words from people who started exactly where you are."
            />

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.figure
                  key={t.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="flex h-full flex-col rounded-4xl border border-cream-300 bg-cream-50 p-7"
                >
                  <div className="flex items-center justify-between">
                    <QuoteIcon className="h-5 w-5 text-cream-300 fill-cream-300" />
                    <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <StarIcon
                          key={s}
                          className={`h-3.5 w-3.5 ${s < t.rating ? "fill-peach-400 text-peach-400" : "text-cream-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-ink-700">{t.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-cream-200 pt-5">
                    <Avatar initials={t.initials} accent={t.accent} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{t.author}</p>
                      <p className="text-xs text-ink-400 font-semibold">{t.context}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 9: FAQ ACCORDION
            ========================================== */}
        <section id="faqs" className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Good questions"
            title="The things people quietly wonder"
            description="If something isn’t here, our care team answers every message within a day."
          />

          <div className="mt-12 divide-y divide-cream-300 border-y border-cream-300">
            {faqItems.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`panel-${faq.id}`}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left transition group cursor-pointer"
                    >
                      <span className={`font-display text-lg transition-colors font-semibold ${isOpen ? "text-sage-700" : "text-ink-900 group-hover:text-ink-700"}`}>
                        {faq.question}
                      </span>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isOpen ? "rotate-45 bg-sage-100 text-sage-700" : "bg-cream-200 text-ink-500 group-hover:bg-cream-300"
                        }`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`panel-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 pr-12 text-sm leading-relaxed text-ink-500 font-medium">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            SECTION 10: FOOTER CTA BANNER
            ========================================== */}
        <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-5xl border border-peach-200/70 bg-peach-50 px-7 py-14 text-center sm:px-14 lg:py-20"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.75),transparent_65%)]" />
              <div className="absolute -bottom-10 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.6),transparent_65%)]" />
            </div>

            <div className="relative mx-auto max-w-2xl">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50 text-peach-500 shadow-soft">
                <HeartHandshakeIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-7 font-display text-3xl leading-tight text-ink-900 sm:text-[2.6rem] font-semibold">
                You don’t have to have the words yet.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                Join 48,000+ people who found a softer place to land. Free forever for peer support, and never a single message shared with
                anyone.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={status === "authenticated" ? openListenerBooking : openJoinModal}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-8 py-4 text-sm font-semibold text-cream-50 transition hover:bg-ink-700 sm:w-auto cursor-pointer"
                >
                  {status === "authenticated" ? "Start a conversation" : "Join Apna Healer free"}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={openListenerBooking}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-peach-200 bg-cream-50/70 px-8 py-4 text-sm font-semibold text-ink-700 backdrop-blur transition hover:bg-cream-50 sm:w-auto cursor-pointer"
                >
                  Talk to a listener first
                </button>
              </div>
              <p className="mt-6 text-xs text-ink-400">No credit card. No diagnosis. No pressure to keep coming back.</p>
            </div>
          </motion.div>
        </section>
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
        <div className="min-h-screen bg-cream-100 flex items-center justify-center" aria-busy="true" aria-label="Loading">
          <div className="w-8 h-8 rounded-full border-4 border-sage-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
