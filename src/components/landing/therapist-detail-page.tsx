"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  HeartHandshakeIcon,
  ChevronLeftIcon,
  BadgeCheckIcon,
  CheckIcon,
  GraduationCapIcon,
  MapPinIcon,
  Share2Icon,
  PauseIcon,
  PlayIcon,
  ChevronDownIcon,
  LanguagesIcon,
  ClockIcon,
  CalendarCheckIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  CalendarIcon
} from "lucide-react";

const DEFAULT_PHILOSOPHY_QUOTE =
  "Healing is not about fixing what is broken, but discovering the wholeness that was always there.";

const DEFAULT_BIO_FALLBACK =
  "Hello! My name is Dyuti and I'm a Consultant Psychologist. I completed my Masters in Clinical Psychology from Manipal University and Bachelors from Delhi University. I view therapy as a process of completing a jigsaw puzzle. Imagine yourself, grappling with a piece of a puzzle, where you struggle to fit it into your life story, and it is difficult to make sense of. Through a collaborative, empathetic space, we will work together to place that piece and design your narrative of wellness.";

const MOCK_FAQS = [
  {
    question: "What happens in the first session?",
    answer: "We talk. I will ask what brought you here and a little about your life right now. Nothing is required of you beyond showing up — you can share as much or as little as feels comfortable."
  },
  {
    question: "How do I know if therapy is right for me?",
    answer: "You do not need a diagnosis or a crisis to begin. If something has been sitting heavily with you for a while, that is reason enough to talk it through with someone."
  },
  {
    question: "Is everything I say confidential?",
    answer: "Yes. Sessions are private and encrypted, and nothing is shared outside our conversation except in rare situations where there is a risk to life, as required by law."
  },
  {
    question: "Can I reschedule or cancel?",
    answer: "You can reschedule or cancel free of charge up to 12 hours before your session, directly from your bookings page."
  },
  {
    question: "How many sessions will I need?",
    answer: "It varies. Some people feel clearer within four to six sessions; others prefer ongoing support. We review together every few weeks and you decide the pace."
  }
];

const MOCK_TESTIMONIALS = [
  {
    quote: "I had put off therapy for years because I expected to be analysed. Instead it felt like being listened to properly for the first time.",
    author: "R. S.",
    context: "Working with Dr. Menon for 6 months"
  },
  {
    quote: "She gave me practical things to try between sessions, which made a real difference at work. I stopped dreading Monday mornings.",
    author: "Priya K.",
    context: "Burnout & work stress"
  },
  {
    quote: "Being able to switch between Malayalam and English meant I could actually explain what I felt, instead of translating it first.",
    author: "A. N.",
    context: "Family conflict"
  },
  {
    quote: "Patient, warm and never rushed. I never once felt like just another appointment on a calendar.",
    author: "Devika M.",
    context: "Anxiety, 1 year of sessions"
  }
];

type PendingBooking = { healer: BookSessionHealer } | null;

function initials(name: string | null): string {
  if (!name) return "AH";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type DayAvailability = {
  key: string;
  date: Date;
  weekday: string;
  dayNumber: string;
  month: string;
  slots: TimeSlot[];
};

type TimeSlot = {
  label: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  available: boolean;
};

const slotTemplate: Omit<TimeSlot, 'available'>[] = [
  { label: '9:00 AM', period: 'Morning' },
  { label: '10:30 AM', period: 'Morning' },
  { label: '12:00 PM', period: 'Afternoon' },
  { label: '2:30 PM', period: 'Afternoon' },
  { label: '4:00 PM', period: 'Afternoon' },
  { label: '6:30 PM', period: 'Evening' },
  { label: '8:00 PM', period: 'Evening' }
];

const unavailablePattern: number[][] = [
  [0, 1, 3],
  [2, 5],
  [],
  [0, 4, 6],
  [1, 2, 3, 4, 5, 6],
  [3],
  [0, 2, 6]
];

function buildAvailability(length = 30): DayAvailability[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();

  return Array.from({ length }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    const key = `${y}-${m}-${d}`;

    const weekday = index === 0 ? 'Today' : days[date.getDay()];
    const dayNumber = date.getDate().toString();
    const month = months[date.getMonth()];

    const blocked = unavailablePattern[index % unavailablePattern.length];

    return {
      key,
      date,
      weekday,
      dayNumber,
      month,
      slots: slotTemplate.map((slot, slotIndex) => ({
        ...slot,
        available: !blocked.includes(slotIndex)
      }))
    };
  });
}

function buildSingleDay(date: Date): DayAvailability {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const key = `${y}-${m}-${d}`;
  return {
    key,
    date,
    weekday: weekdays[date.getDay()],
    dayNumber: date.getDate().toString(),
    month: months[date.getMonth()],
    slots: []
  };
}

export function TherapistDetailPage() {
  const params = useParams<{ id: string }>();
  const therapistId = params.id;
  const { data: session, status } = useSession();
  const isProvider = session?.user?.role === "THERAPIST" || session?.user?.role === "LISTENER";
  const { open: openBookSession } = useBookSessionModal();
  const pendingBookingRef = useRef<PendingBooking>(null);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const query = useQuery({
    queryKey: ["public-therapist", therapistId],
    queryFn: () => apiFetch<any>(`/api/public/providers/${therapistId}`),
    enabled: Boolean(therapistId),
  });

  const therapist = query.data;

  // Single Session Booking state
  const days = useMemo(() => buildAvailability(30), []);
  const [customDays, setCustomDays] = useState<DayAvailability[]>([]);
  const allDays = useMemo(() => [...days, ...customDays], [days, customDays]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (allDays.length > 0 && !selectedDay) {
      setSelectedDay(allDays[0].key);
    }
  }, [allDays, selectedDay]);

  const slotsQuery = useQuery({
    queryKey: ["public-therapist-slots", therapistId, selectedDay],
    queryFn: () => apiFetch<any>(`/api/therapists/${therapistId}/weekly-slots?date=${encodeURIComponent(selectedDay || "")}`),
    enabled: !!therapistId && !!selectedDay,
  });

  const slotsList = useMemo(() => {
    return (slotsQuery.data?.slots ?? []).filter((s: any) => !s.isBooked);
  }, [slotsQuery.data?.slots]);

  const activeDay = allDays.find((day) => day.key === selectedDay) ?? null;
  const canBook = Boolean(selectedDay && selectedSlot);

  const handleSelectDay = (key: string) => {
    setSelectedDay(key);
    setSelectedSlot(null);
    setConfirmed(false);
  };

  const openJoinModal = useCallback(() => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsSigningIn(false);
    setIsJoinModalOpen(true);
  }, []);

  const beginJourney = useCallback(() => {
    if (!therapist) return;

    let preselection = undefined;
    if (selectedDay !== null && selectedSlot !== null) {
      const slotObj = slotsList.find((s: any) => s.start === selectedSlot);
      preselection = {
        dateYmd: selectedDay,
        start: selectedSlot,
        end: slotObj?.end ?? `${String(parseInt(selectedSlot.split(":")[0]) + 1).padStart(2, "0")}:${selectedSlot.split(":")[1]}`,
      };
    }

    const healer: BookSessionHealer = {
      providerId: therapist.id,
      name: therapist.name ?? "Therapist",
      preferredRole: "THERAPIST",
      imageSrc: therapist.image,
      specialty: therapist.specializations?.[0] ?? "Therapist",
      preselection,
    };
    if (status !== "authenticated") {
      pendingBookingRef.current = { healer };
      openJoinModal();
      return;
    }
    openBookSession(healer);
  }, [therapist, status, selectedDay, selectedSlot, slotsList, openJoinModal, openBookSession]);

  const handleBookPackage = useCallback((pkg: any) => {
    if (!therapist) return;
    const healer: BookSessionHealer = {
      providerId: therapist.id,
      name: therapist.name ?? "Therapist",
      preferredRole: "THERAPIST",
      imageSrc: therapist.image,
      specialty: therapist.specializations?.[0] ?? "Therapist",
      initialBookingOption: "PACKAGE",
      initialPackageId: pkg.id,
    };
    if (status !== "authenticated") {
      pendingBookingRef.current = { healer };
      openJoinModal();
      return;
    }
    openBookSession(healer);
  }, [therapist, status, openJoinModal, openBookSession]);

  useEffect(() => {
    if (status === "authenticated" && pendingBookingRef.current) {
      const pending = pendingBookingRef.current;
      pendingBookingRef.current = null;
      openBookSession(pending.healer);
    }
  }, [status, openBookSession]);

  useEffect(() => {
    document.body.style.overflow = isJoinModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isJoinModalOpen]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn("google", {
        callbackUrl: `/therapists/${therapistId}`,
      });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setIsSigningIn(false);
    }
  };

  const name = therapist?.name ?? "Therapist";

  // Dynamic values parsed from database
  const credentials = useMemo(() => {
    const certs = therapist?.certifications?.filter(Boolean) ?? [];
    if (certs.length > 0) {
      return certs.map((c: string) => {
        const parts = c.split(/\s+from\s+|\s*\(\s*/i);
        const degree = parts[0]?.trim() || c;
        let institution = parts[1]?.replace(/\)$/, "")?.trim() || "Apna Healer Academy";
        return { degree, institution };
      });
    }
    return [
      { degree: 'M.Phil. Clinical Psychology', institution: 'NIMHANS, Bengaluru' },
      { degree: 'M.A. Psychology', institution: 'University of Delhi' }
    ];
  }, [therapist?.certifications]);

  const bioShort = therapist?.philosophyQuote ?? DEFAULT_PHILOSOPHY_QUOTE;
  const bioFull = useMemo(() => {
    if (!therapist?.bio) return [DEFAULT_BIO_FALLBACK];
    return therapist.bio.split(/\n+/).map((p: string) => p.trim()).filter(Boolean);
  }, [therapist?.bio]);

  const concernsList = useMemo(() => {
    return therapist?.specializations?.filter((s: string) => !s.toLowerCase().includes("therapy") && !s.toLowerCase().includes("cbt")) ?? [
      'Anxiety & overthinking',
      'Depression & low mood',
      'Work burnout',
      'Relationship difficulties',
      'Self-esteem',
      'Life transitions'
    ];
  }, [therapist?.specializations]);

  const specializationsList = useMemo(() => {
    return therapist?.specializations?.filter(Boolean) ?? [
      'Cognitive Behavioural Therapy (CBT)',
      'Acceptance & Commitment Therapy (ACT)',
      'Mindfulness-Based Stress Reduction',
      'Trauma-informed practice'
    ];
  }, [therapist?.specializations]);

  const languagesList = therapist?.languages?.length > 0 ? therapist.languages : ['English', 'Hindi'];

  const affiliationsList = useMemo(() => {
    return [
      { name: 'Rehabilitation Council of India', role: 'Licensed Practitioner (CRR)' },
      { name: 'Indian Association of Clinical Psychologists', role: 'Life Member' }
    ];
  }, []);

  const mappedPackages = useMemo(() => {
    const list = therapist?.packagesCreated ?? [];
    if (list.length > 0) {
      return list.map((pkg: any) => {
        const totalSessions = pkg.allocations?.reduce((sum: number, a: any) => sum + a.sessionCount, 0) ?? 0;
        const originalPrice = Number(pkg.price);
        const discountPercent = Number(pkg.discount || 0);
        const finalPrice = originalPrice - originalPrice * (discountPercent / 100);
        return {
          id: pkg.id,
          name: pkg.title,
          sessions: totalSessions,
          originalPrice: originalPrice,
          price: finalPrice,
          description: pkg.description,
          rawPackage: pkg
        };
      });
    }
    const rate = Number(therapist?.hourlyRate ?? 1499);
    return [
      {
        id: 'starter',
        name: 'Getting Started',
        sessions: 4,
        originalPrice: rate * 4,
        price: Math.round(rate * 4 * 0.9),
        description: 'Four weekly sessions to settle in and find your footing.'
      },
      {
        id: 'steady',
        name: 'Steady Progress',
        sessions: 8,
        originalPrice: rate * 8,
        price: Math.round(rate * 8 * 0.83),
        description: 'Two months of consistent work on a specific concern.'
      },
      {
        id: 'deep',
        name: 'Deeper Work',
        sessions: 12,
        originalPrice: rate * 12,
        price: Math.round(rate * 12 * 0.77),
        description: 'For longer-term patterns that need time and continuity.'
      }
    ];
  }, [therapist]);

  const experienceLabel = therapist?.experienceYears
    ? `${therapist.experienceYears}`
    : "10";

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#33302B]">
      {/* Global scrollbar removal */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Hide scrollbars globally on this page */
        *::-webkit-scrollbar {
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      <LandingNavbar onJoinClick={openJoinModal} />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/therapists"
          className="inline-flex items-center gap-1.5 text-sm text-[#5F5A52] transition-colors duration-150 ease-out hover:text-[#2E4739] mb-8 font-semibold"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          All therapists
        </Link>

        {query.isLoading ? (
          <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="h-40 animate-pulse rounded-3xl bg-[#EAE3D8]" />
              <div className="h-64 animate-pulse rounded-3xl bg-[#EAE3D8]" />
            </div>
            <div className="h-[400px] animate-pulse rounded-3xl bg-[#EAE3D8]" />
          </div>
        ) : query.error || !therapist ? (
          <div className="mt-12 rounded-3xl border border-dashed border-[#DDD4C6] bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold">Therapist not found</p>
            <Link href="/therapists" className="mt-4 inline-block text-xs font-bold text-[#2E4739] hover:underline">
              Browse all therapists
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">

            {/* Center-Left Scrollable Column */}
            <div className="lg:col-span-7 xl:col-span-8">

              {/* Profile Header Summary */}
              <ProfileHeader
                name={name}
                photo={therapist.image}
                title={therapist.role === "THERAPIST" ? "Consultant Psychologist" : "Listener"}
                verified={true}
                experienceYears={experienceLabel}
                sessionsCompleted={therapist.sessionsCompleted ?? 1200}
                location={`${therapist.city ?? "Bengaluru"} · Online sessions`}
                credentials={credentials}
              />

              {/* Video Introduction Box */}
              {!!(therapist.videoUrl || therapist.introVideoUrl || therapist.video) && (
                <div className="mt-10">
                  <VideoIntro
                    poster={therapist.image || "/1319c024-f930-4806-99d6-7e584018bce8.jpg"}
                    length="1:42"
                    therapistName={name}
                  />
                </div>
              )}

              {/* Biography Section */}
              <Section id="about" title={`About ${name.split(" ")[0] || "Therapist"}`}>
                <Biography intro={bioShort} paragraphs={bioFull} />
              </Section>

              {/* Concerns I help with */}
              <Section
                id="concerns"
                title="Concerns she helps with"
                description="If what you are carrying is not listed, it is still worth asking."
              >
                <ConcernsList concerns={concernsList} />
              </Section>

              {/* Approach & specialisations */}
              <Section id="approach" title="Approach & specialisations">
                <SpecializationsList items={specializationsList} />
              </Section>

              {/* Languages */}
              <Section id="languages" title="Languages">
                <LanguagesRow languages={languagesList} />
              </Section>

              {/* Professional affiliations */}
              <Section id="affiliations" title="Professional affiliations">
                <AffiliationsList affiliations={affiliationsList} />
              </Section>

              {/* FAQs Carousel */}
              <FaqCarousel faqs={MOCK_FAQS} therapistFirstName={name.split(" ")[0]} />

              {/* Testimonials Carousel */}
              <TestimonialCarousel testimonials={MOCK_TESTIMONIALS} />

            </div>

            {/* Center-Right Sticky Booking & Packages Column */}
            <aside className="lg:col-span-5 xl:col-span-4">
              <div className="no-scrollbar lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto space-y-6">

                {isProvider ? (
                  <div className="rounded-3xl border border-[#EAE3D8] bg-white/80 p-6 shadow-soft text-center space-y-4">
                    <h3 className="font-display text-lg font-bold text-[#2E4739]">Provider Account</h3>
                    <p className="text-sm text-[#5F5A52]">
                      Professional provider account - booking therapist sessions is not available.
                    </p>
                  </div>
                ) : (
                  <BookingCard
                    therapist={therapist}
                    days={allDays}
                    selectedDay={selectedDay}
                    onSelectDay={handleSelectDay}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    confirmed={confirmed}
                    onConfirm={() => setConfirmed(true)}
                    canBook={canBook}
                    beginJourney={beginJourney}
                    slotsList={slotsList}
                    isLoadingSlots={slotsQuery.isLoading}
                    startIndex={startIndex}
                    onPrevDays={() => setStartIndex((prev) => Math.max(0, prev - 1))}
                    onNextDays={() => setStartIndex((prev) => Math.min(allDays.length - 4, prev + 1))}
                    onSelectCalendarDate={(val) => {
                      const dateObj = new Date(`${val}T00:00:00`);
                      const existingIdx = allDays.findIndex((d) => d.key === val);
                      if (existingIdx !== -1) {
                        setSelectedDay(val);
                        setStartIndex(Math.max(0, Math.min(allDays.length - 4, existingIdx)));
                      } else {
                        const newDay = buildSingleDay(dateObj);
                        setCustomDays((prev) => [...prev, newDay]);
                        setSelectedDay(val);
                        setStartIndex(allDays.length);
                      }
                    }}
                  />
                )}

                <PackageList
                  packages={mappedPackages}
                  handleBookPackage={handleBookPackage}
                />
              </div>
            </aside>

          </div>
        )}
      </main>

      <LandingFooter />

      <LandingJoinModal
        open={isJoinModalOpen}
        onClose={() => !isSigningIn && setIsJoinModalOpen(false)}
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
        onPhoneSubmit={(e) => {
          e.preventDefault();
          if (phoneNumber.trim()) setIsOtpStage(true);
        }}
        onOtpSubmit={(e) => e.preventDefault()}
      />
    </div>
  );
}

/* Inlined Child Components mapped exactly to template design */

function Section({
  title,
  description,
  id,
  action,
  children
}: {
  title: string;
  description?: string;
  id?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-heading`} className="pt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2
            id={`${id ?? title}-heading`}
            className="font-display text-2xl text-[#2E4739] font-semibold"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[#5F5A52]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProfileHeader({
  name,
  photo,
  title,
  verified,
  experienceYears,
  sessionsCompleted,
  location,
  credentials
}: {
  name: string;
  photo?: string | null;
  title: string;
  verified: boolean;
  experienceYears: string;
  sessionsCompleted: number;
  location: string;
  credentials: { degree: string; institution: string }[];
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 text-left">
      <div className="h-32 w-32 flex-none rounded-3xl overflow-hidden bg-[#F5F0E8] border border-[#EAE3D8] sm:h-40 sm:w-40">
        {photo ? (
          <img
            src={photo}
            alt={`Portrait of ${name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/40 bg-gradient-to-tr from-[#2E4739] to-[#87AB92]">
            {initials(name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display text-3xl leading-tight text-[#2E4739] sm:text-4xl font-semibold">
                {name}
              </h1>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E3ECE5] px-2.5 py-1 text-xs font-semibold text-[#587761]">
                  <BadgeCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-base text-[#5F5A52] font-medium">{title}</p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex flex-none items-center gap-2 rounded-full border border-[#DDD4C6] px-4 py-2 text-sm font-semibold text-[#33302B] transition-colors duration-150 ease-out hover:border-[#A8C3AF] hover:bg-[#F1F5F1] cursor-pointer"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-[#587761]" aria-hidden="true" />
            ) : (
              <Share2Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Link copied' : 'Share profile'}
          </button>
        </div>

        <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Experience</dt>
            <dd className="text-[#33302B]">
              <span className="font-semibold">{experienceYears}+ years</span>{' '}
              <span className="text-[#8C867C] font-medium">experience</span>
            </dd>
          </div>
          <span className="h-1 w-1 rounded-full bg-[#DDD4C6]" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Sessions completed</dt>
            <dd className="text-[#33302B]">
              <span className="font-semibold">
                {sessionsCompleted.toLocaleString('en-IN')}+
              </span>{' '}
              <span className="text-[#8C867C] font-medium">sessions</span>
            </dd>
          </div>
          <span className="h-1 w-1 rounded-full bg-[#DDD4C6]" aria-hidden="true" />
          <div className="flex items-center gap-1.5 text-[#8C867C]">
            <dt className="sr-only">Location</dt>
            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
            <dd className="font-medium">{location}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-1.5">
          {credentials.map((credential, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-[#5F5A52]"
            >
              <GraduationCapIcon
                className="mt-0.5 h-4 w-4 flex-none text-[#87AB92]"
                aria-hidden="true"
              />
              <span>
                <span className="text-[#33302B] font-semibold">{credential.degree}</span>
                <span className="text-[#8C867C] font-medium"> · {credential.institution}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function VideoIntro({
  poster,
  length,
  therapistName
}: {
  poster: string;
  length: string;
  therapistName: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-[#EAE3D8] bg-[#F5F0E8]">
      <img
        src={poster}
        alt={`Still from ${therapistName}'s video introduction`}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[#1F3227]/25" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setPlaying((value) => !value)}
        aria-label={playing ? 'Pause video introduction' : 'Play video introduction'}
        className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none cursor-pointer"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBF8F3]/95 text-[#2E4739] shadow-[0_2px_4px_rgba(51,48,43,0.04),_0_16px_32px_-16px_rgba(51,48,43,0.16)] transition-transform duration-150 ease-out group-hover:scale-105">
          {playing ? (
            <PauseIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <PlayIcon className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
          )}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 sm:inset-x-6 sm:bottom-5">
        <p className="text-sm font-medium text-[#FBF8F3]">
          {playing ? 'Now playing' : `A short hello from ${therapistName.split(' ')[1] || therapistName}`}
        </p>
        <span className="rounded-full bg-[#1F3227]/60 px-2.5 py-1 text-xs font-medium text-[#FBF8F3]">
          {length}
        </span>
      </div>

      {playing ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#FBF8F3]/25" aria-hidden="true">
          <motion.div
            className="h-full bg-[#A8C3AF]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 108, ease: 'linear' }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Biography({ intro, paragraphs }: { intro: string; paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="text-left">
      <p className="max-w-2xl font-display text-xl leading-relaxed text-[#2E4739] font-medium">
        {intro}
      </p>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="bio"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="max-w-2xl space-y-4 pt-5 text-[15px] leading-relaxed text-[#5F5A52] font-medium">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#587761] transition-colors duration-150 ease-out hover:text-[#2E4739] cursor-pointer"
      >
        {expanded ? 'Show less' : 'Read full introduction'}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ease-out ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function ConcernsList({ concerns }: { concerns: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2 text-left">
      {concerns.map((concern) => (
        <li
          key={concern}
          className="rounded-full border border-[#EAE3D8] bg-white/70 px-4 py-2 text-sm text-[#5F5A52] font-semibold transition-colors duration-150 ease-out hover:border-[#C8DACD] hover:bg-[#F1F5F1] hover:text-[#2E4739]"
        >
          {concern}
        </li>
      ))}
    </ul>
  );
}

function SpecializationsList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 text-left">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#5F5A52] font-semibold">
          <CheckIcon
            className="mt-0.5 h-4 w-4 flex-none text-[#87AB92]"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function LanguagesRow({ languages }: { languages: string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[15px] text-[#5F5A52] font-medium text-left">
      <LanguagesIcon className="h-4 w-4 text-[#87AB92]" aria-hidden="true" />
      <span>Sessions can be held in </span>
      <span className="text-[#33302B] font-semibold">{languages.join(', ')}</span>
      <span className="text-[#8C867C]">— or a comfortable mix of them.</span>
    </p>
  );
}

function AffiliationsList({ affiliations }: { affiliations: { name: string; role: string }[] }) {
  return (
    <ul className="divide-y divide-[#EAE3D8] border-y border-[#EAE3D8] text-left">
      {affiliations.map((affiliation) => (
        <li
          key={affiliation.name}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5"
        >
          <span className="text-[15px] text-[#33302B] font-semibold">{affiliation.name}</span>
          <span className="text-sm text-[#8C867C] font-medium">{affiliation.role}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqCarousel({ faqs, therapistFirstName }: { faqs: typeof MOCK_FAQS; therapistFirstName: string }) {
  return (
    <section aria-labelledby="faqs-heading" className="pt-10 text-left overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-faq {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-faq {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: marquee-faq 35s linear infinite;
        }
        .animate-marquee-faq:hover {
          animation-play-state: paused;
        }
      `}} />
      <div className="mb-5">
        <h2 id="faqs-heading" className="font-display text-2xl text-[#2E4739] font-semibold">
          Common questions
        </h2>
        <p className="mt-1 text-sm text-[#5F5A52] font-medium">
          Answered by Dr. {therapistFirstName || "Menon"}, for anyone starting out.
        </p>
      </div>

      <div className="overflow-hidden relative w-full">
        {/* Left/right fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-faq">
          {[...faqs, ...faqs, ...faqs].map((faq, index) => (
            <div
              key={`${faq.question}-${index}`}
              className="w-[19rem] sm:w-[22rem] shrink-0 rounded-3xl border border-[#EAE3D8] bg-white/70 p-6"
            >
              <h3 className="font-display text-lg leading-snug text-[#2E4739] font-semibold">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5F5A52] font-medium">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCarousel({ testimonials }: { testimonials: typeof MOCK_TESTIMONIALS }) {
  return (
    <section aria-labelledby="testimonials-heading" className="pt-10 text-left overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-testi {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-testi {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: marquee-testi 40s linear infinite;
        }
        .animate-marquee-testi:hover {
          animation-play-state: paused;
        }
      `}} />
      <div className="mb-5">
        <h2 id="testimonials-heading" className="font-display text-2xl text-[#2E4739] font-semibold">
          In their words
        </h2>
        <p className="mt-1 text-sm text-[#5F5A52] font-medium">
          Shared anonymously, with permission.
        </p>
      </div>

      <div className="overflow-hidden relative w-full">
        {/* Left/right fade gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-testi">
          {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`${testimonial.author}-${index}`}
              className="flex w-[19rem] sm:w-[22rem] shrink-0 flex-col rounded-3xl bg-[#F4F2FA] p-6 text-left"
            >
              <p className="font-display text-lg leading-relaxed text-[#2E4739] font-medium">
                “{testimonial.quote}”
              </p>
              <div className="mt-auto pt-6">
                <p className="text-sm font-semibold text-[#33302B]">{testimonial.author}</p>
                <p className="mt-0.5 text-sm text-[#8C867C] font-medium">{testimonial.context}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatSlotLabel(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function BookingCard({
  therapist,
  days,
  selectedDay,
  onSelectDay,
  selectedSlot,
  onSelectSlot,
  confirmed,
  onConfirm,
  canBook,
  beginJourney,
  slotsList,
  isLoadingSlots,
  startIndex,
  onPrevDays,
  onNextDays,
  onSelectCalendarDate
}: {
  therapist: any;
  days: DayAvailability[];
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  selectedSlot: string | null;
  onSelectSlot: (label: string) => void;
  confirmed: boolean;
  onConfirm: () => void;
  canBook: boolean;
  beginJourney: () => void;
  slotsList: any[];
  isLoadingSlots: boolean;
  startIndex: number;
  onPrevDays: () => void;
  onNextDays: () => void;
  onSelectCalendarDate: (val: string) => void;
}) {
  const activeDayObj = days.find((day) => day.key === selectedDay) ?? null;
  const datePickerRef = useRef<HTMLInputElement>(null);

  const todayYmd = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, "0");
    const d = today.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const visibleDays = useMemo(() => {
    return days.slice(startIndex, startIndex + 4);
  }, [days, startIndex]);

  const morningSlots = useMemo(() => {
    return slotsList.filter((slot) => {
      const [hStr] = slot.start.split(":");
      const h = parseInt(hStr, 10);
      return h < 12;
    });
  }, [slotsList]);

  const afternoonSlots = useMemo(() => {
    return slotsList.filter((slot) => {
      const [hStr] = slot.start.split(":");
      const h = parseInt(hStr, 10);
      return h >= 12 && h < 17;
    });
  }, [slotsList]);

  const eveningSlots = useMemo(() => {
    return slotsList.filter((slot) => {
      const [hStr] = slot.start.split(":");
      const h = parseInt(hStr, 10);
      return h >= 17;
    });
  }, [slotsList]);

  return (
    <div className="rounded-3xl border border-[#EAE3D8] bg-white/80 p-6 shadow-[0_1px_2px_rgba(51,48,43,0.03),_0_8px_24px_-12px_rgba(51,48,43,0.10)] text-left">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-3xl text-[#2E4739] font-semibold">
            ₹{Number(therapist.hourlyRate ?? 1499).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#8C867C] font-medium">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            50-minute session
          </p>
        </div>
        <span className="rounded-full bg-[#E3ECE5] px-3 py-1 text-xs font-semibold text-[#587761]">
          Online
        </span>
      </div>

      <fieldset className="mt-6 border-0 p-0 m-0">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-[#33302B]">Choose a day</legend>
          <div className="relative">
            <input
              type="date"
              ref={datePickerRef}
              min={todayYmd}
              onChange={(e) => {
                const val = e.target.value;
                if (val) onSelectCalendarDate(val);
              }}
              className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
            />
            <button
              type="button"
              onClick={() => datePickerRef.current?.showPicker()}
              className="flex items-center gap-1 text-xs font-bold text-[#6E9179] hover:text-[#587761] border border-[#6E9179]/20 rounded-full px-2.5 py-1 hover:bg-[#F1F5F1] transition cursor-pointer"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            disabled={startIndex === 0}
            onClick={onPrevDays}
            className="p-1.5 rounded-full border border-[#EAE3D8] hover:bg-[#F1F5F1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <ChevronLeftIcon className="h-4 w-4 text-[#33302B]" />
          </button>

          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {visibleDays.map((day) => {
              const selected = day.key === selectedDay;
              return (
                <button
                  key={day.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectDay(day.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl border px-1 py-2.5 transition-colors duration-150 ease-out cursor-pointer ${selected ?
                    'border-[#6E9179] bg-[#6E9179] text-white' :
                    'border-[#EAE3D8] text-[#33302B] hover:border-[#A8C3AF] hover:bg-[#F1F5F1]'
                    }`}
                >
                  <span className="text-[10px] uppercase tracking-wide opacity-80 font-bold truncate max-w-full">
                    {day.weekday === 'Today' ? 'Now' : day.weekday}
                  </span>
                  <span className="text-sm font-bold">{day.dayNumber}</span>
                  <span className={`text-[8px] font-semibold mt-1 block ${selected ? "text-white/90" : "text-[#8C867C]"
                    }`}>
                    {selected ? (isLoadingSlots ? "loading..." : `${slotsList.length} slots`) : "select"}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={startIndex + 4 >= days.length}
            onClick={onNextDays}
            className="p-1.5 rounded-full border border-[#EAE3D8] hover:bg-[#F1F5F1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <ChevronRightIcon className="h-4 w-4 text-[#33302B]" />
          </button>
        </div>
      </fieldset>

      <fieldset className="mt-6 border-0 p-0 m-0">
        <legend className="text-sm font-semibold text-[#33302B]">
          {activeDayObj ?
            `Times on ${activeDayObj.weekday === 'Today' ? 'today' : `${activeDayObj.weekday} ${activeDayObj.dayNumber} ${activeDayObj.month}`}` :
            'Times'}
        </legend>
        <div className="mt-3">
          {isLoadingSlots ? (
            <div className="text-xs text-[#8C867C] font-semibold animate-pulse py-2">
              Loading available slots...
            </div>
          ) : slotsList.length > 0 ? (
            <div className="space-y-4">
              {/* Morning Slots */}
              {morningSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C867C] mb-2">Morning</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {morningSlots.map((slot) => {
                      const selected = selectedSlot === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            onSelectSlot(slot.start);
                            onConfirm();
                          }}
                          className={`rounded-xl border px-1 py-2 text-[13px] font-semibold transition-colors duration-150 ease-out cursor-pointer ${selected ?
                            'border-[#6E9179] bg-[#6E9179] text-white' :
                            'border-[#EAE3D8] text-[#5F5A52] hover:border-[#A8C3AF] hover:bg-[#F1F5F1] hover:text-[#2E4739]'
                            }`}
                        >
                          {formatSlotLabel(slot.start)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Afternoon Slots */}
              {afternoonSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C867C] mb-2">Afternoon</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {afternoonSlots.map((slot) => {
                      const selected = selectedSlot === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            onSelectSlot(slot.start);
                            onConfirm();
                          }}
                          className={`rounded-xl border px-1 py-2 text-[13px] font-semibold transition-colors duration-150 ease-out cursor-pointer ${selected ?
                            'border-[#6E9179] bg-[#6E9179] text-white' :
                            'border-[#EAE3D8] text-[#5F5A52] hover:border-[#A8C3AF] hover:bg-[#F1F5F1] hover:text-[#2E4739]'
                            }`}
                        >
                          {formatSlotLabel(slot.start)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {eveningSlots.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C867C] mb-2">Evening</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {eveningSlots.map((slot) => {
                      const selected = selectedSlot === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            onSelectSlot(slot.start);
                            onConfirm();
                          }}
                          className={`rounded-xl border px-1 py-2 text-[13px] font-semibold transition-colors duration-150 ease-out cursor-pointer ${selected ?
                            'border-[#6E9179] bg-[#6E9179] text-white' :
                            'border-[#EAE3D8] text-[#5F5A52] hover:border-[#A8C3AF] hover:bg-[#F1F5F1] hover:text-[#2E4739]'
                            }`}
                        >
                          {formatSlotLabel(slot.start)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#8C867C] font-semibold py-2">
              No slots available for this date.
            </div>
          )}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!canBook}
        onClick={beginJourney}
        className={`mt-6 w-full rounded-2xl px-5 py-3.5 text-sm font-bold transition-colors duration-150 ease-out cursor-pointer ${canBook ?
          'bg-[#2E4739] text-[#FBF8F3] hover:bg-[#1F3227]' :
          'cursor-not-allowed bg-[#F5F0E8] text-[#8C867C]/60'
          }`}
      >
        {confirmed ? 'Book Session' : 'Select Slot'}
      </button>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#8C867C] font-semibold">
        {confirmed ? (
          <>
            <CalendarCheckIcon
              className="mt-px h-3.5 w-3.5 flex-none text-[#6E9179]"
              aria-hidden="true"
            />
            Your slot will be locked while you complete checkout details.
          </>
        ) : (
          <>
            <ShieldCheckIcon
              className="mt-px h-3.5 w-3.5 flex-none text-[#8C867C]"
              aria-hidden="true"
            />
            {canBook ?
              'Free rescheduling up to 12 hours before your session.' :
              'Pick a day and a time to continue. Nothing is charged yet.'}
          </>
        )}
      </p>
    </div>
  );
}

function PackageList({
  packages,
  handleBookPackage
}: {
  packages: any[];
  handleBookPackage: (pkg: any) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section aria-labelledby="packages-heading" className="mt-6 text-left">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="packages-heading" className="font-display text-lg text-[#2E4739] font-semibold">
          Session packages
        </h2>
        <span className="text-xs text-[#8C867C] font-medium">Pay once, book as you go</span>
      </div>

      <ul className="space-y-3 p-0 m-0">
        {packages.map((pack) => {
          const discount = Math.round(
            (pack.originalPrice - pack.price) / pack.originalPrice * 100
          );
          const isSelected = selected === pack.id;
          return (
            <li
              key={pack.id}
              className={`rounded-3xl border bg-white/70 p-5 transition-colors duration-150 ease-out list-none ${isSelected ? 'border-[#6E9179] bg-[#F1F5F1]' : 'border-[#EAE3D8] hover:border-[#C8DACD]'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#2E4739]">{pack.name}</h3>
                  <p className="mt-0.5 text-xs text-[#8C867C] font-semibold">
                    {pack.sessions} sessions
                  </p>
                </div>
                <span className="flex-none rounded-full bg-[#F9E5D7] px-2.5 py-1 text-xs font-semibold text-[#C97F4E]">
                  {discount}% off
                </span>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed line-clamp-1 text-[#5F5A52] font-semibold">
                {pack.description}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-xl text-[#2E4739] font-semibold">
                    ₹{pack.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-[#8C867C] line-through font-medium">
                    ₹{pack.originalPrice.toLocaleString('en-IN')}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      handleBookPackage(pack.rawPackage ?? pack);
                    } else {
                      setSelected(pack.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`flex-none rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ease-out cursor-pointer ${isSelected ?
                    'bg-[#6E9179] text-white hover:bg-[#587761]' :
                    'border border-[#DDD4C6] text-[#33302B] hover:border-[#A8C3AF] hover:bg-[#F1F5F1]'
                    }`}
                >
                  {isSelected ? 'Book Package' : 'Select'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
