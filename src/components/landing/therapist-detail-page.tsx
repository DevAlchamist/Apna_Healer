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

const DEFAULT_PHILOSOPHY_QUOTE =
  "Healing is not about fixing what is broken, but discovering the wholeness that was always there.";

const DEFAULT_BIO_FALLBACK =
  "Hello! My name is Dyuti and I'm a Consultant Psychologist. I completed my Masters in Clinical Psychology from Manipal University and Bachelors from Delhi University. I view therapy as a process of completing a jigsaw puzzle. Imagine yourself, grappling with a piece of a puzzle, where you struggle to fit it into your life story, and it is difficult to make sense of. Through a collaborative, empathetic space, we will work together to place that piece and design your narrative of wellness.";

const MOCK_FAQS = [
  {
    question: "Why did you choose to become a therapist?",
    answer: "Growing up in a joint family provided me with ample opportunities to interact with diverse individuals, understand their emotional nuances, and witness the power of active listening. I realized that a compassionate, structured space can help people heal from deep-seated struggles and achieve self-actualization."
  },
  {
    question: "What should I expect in my first session?",
    answer: "The first session is a safe space for you to share your primary concerns, symptoms, and expectations. We will conduct a gentle assessment of your history, discuss potential goals, and align on a collaborative therapeutic process that fits your pace."
  },
  {
    question: "How long does the therapy journey take?",
    answer: "Therapy is a highly individualized process. Some clients experience positive shifts and learn coping mechanisms within 8-12 sessions, while others benefit from longer-term support. We will review your progress regularly and decide together."
  }
];

const MOCK_TESTIMONIALS = [
  {
    quote: "My sessions with Dyuti have been going really well, and I have nothing but positive feedback to share. She has helped me unpack my anxiety step-by-step and replace my limiting patterns with healthy beliefs.",
    author: "Anonymous Client"
  },
  {
    quote: "I felt a massive weight lift off my shoulders from the very first session. The psychoeducation on stress and narrative techniques she offered were extremely easy to apply in my day-to-day life.",
    author: "Software Engineer, Bengaluru"
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

  // Redesign state variables
  const [showFullBio, setShowFullBio] = useState(false);
  const [sessionType, setSessionType] = useState<"video" | "inperson" | "call">("video");
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // FAQ Carousel state
  const [faqIndex, setFaqIndex] = useState(0);
  
  // Testimonial Carousel state
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const query = useQuery({
    queryKey: ["public-therapist", therapistId],
    queryFn: () => apiFetch<any>(`/api/public/providers/${therapistId}`),
    enabled: Boolean(therapistId),
  });

  const therapist = query.data;

  const specializations = useMemo(() => {
    return therapist?.specializations?.filter(Boolean) ?? [
      "Cognitive Behaviour Therapy",
      "Trauma-Informed Therapy",
      "Narrative Therapy",
      "Acceptance and Commitment Therapy (ACT)",
      "Emotion Focused Approach (EFT)"
    ];
  }, [therapist?.specializations]);

  const certifications = useMemo(() => {
    return therapist?.certifications?.filter(Boolean) ?? [
      "Master of Science in Clinical Psychology (Manipal University)",
      "Bachelor of Arts in Psychology (Delhi University)",
      "Accredited Cognitive Behavioural Practitioner"
    ];
  }, [therapist?.certifications]);

  const experienceLabel = therapist?.experienceYears
    ? `${therapist.experienceYears}+ Years`
    : "10+ Years";

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
    if (selectedDateIdx !== null && selectedTimeSlot !== null) {
      const targetDate = new Date(Date.now() + (selectedDateIdx + 1) * 24 * 60 * 60 * 1000);
      const y = targetDate.getFullYear();
      const m = (targetDate.getMonth() + 1).toString().padStart(2, "0");
      const d = targetDate.getDate().toString().padStart(2, "0");
      const dateYmd = `${y}-${m}-${d}`;

      // parse time to HH:mm (e.g. "03:30 PM" -> "15:30")
      const match = selectedTimeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      let startHHmm = selectedTimeSlot;
      if (match) {
        let hours = Number(match[1]);
        const minutes = Number(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours !== 12) {
          hours += 12;
        } else if (ampm === "AM" && hours === 12) {
          hours = 0;
        }
        startHHmm = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }

      // calculate end (50 minutes later)
      const [h, min] = startHHmm.split(":").map(Number);
      const startMinutes = h * 60 + min;
      const endMinutes = startMinutes + 50;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      const endHHmm = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      preselection = {
        dateYmd,
        start: startHHmm,
        end: endHHmm,
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
  }, [therapist, status, selectedDateIdx, selectedTimeSlot, openJoinModal, openBookSession]);

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

  // Mock available dates scroller starting from tomorrow
  const availableDates = useMemo(() => {
    const list = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = days[targetDate.getDay()];
      const dayNum = targetDate.getDate();
      const monthName = months[targetDate.getMonth()];
      
      const suffix = (day: number) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      };

      list.push({
        label: `${dayNum}${suffix(dayNum)} ${monthName}`,
        day: dayName,
        available: i % 4 !== 3, // mock some dates as not available
        slotsCount: (i * 2 + 1) % 4, // mock slot count (e.g. 1 available, 3 available)
      });
    }
    return list;
  }, []);

  const mockTimeSlots = [
    "09:30 AM", "11:00 AM", "12:30 PM", "03:30 PM", "05:00 PM"
  ];

  const name = therapist?.name ?? "Therapist";

  // Left bio text toggle limits
  const bioText = therapist?.bio?.trim() || DEFAULT_BIO_FALLBACK;
  const isBioLong = bioText.length > 280;
  const displayedBio = showFullBio ? bioText : `${bioText.slice(0, 280)}...`;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-8 md:px-10">
        <Link
          href="/therapists"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#2f745f] transition hover:underline"
        >
          ← ALL THERAPISTS
        </Link>

        {query.isLoading ? (
          <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="h-40 animate-pulse rounded-3xl bg-[#e8e6e1]" />
              <div className="h-64 animate-pulse rounded-3xl bg-[#e8e6e1]" />
            </div>
            <div className="h-[400px] animate-pulse rounded-3xl bg-[#e8e6e1]" />
          </div>
        ) : query.error || !therapist ? (
          <div className="mt-12 rounded-3xl border border-dashed border-[#cfd4d2] bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold">Therapist not found</p>
            <Link href="/therapists" className="mt-4 inline-block text-xs font-bold text-[#2f745f] hover:underline">
              Browse all therapists
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Center-Left Scrollable Column */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Profile Header Summary */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-[#e8ddd0] border border-[#ebe8e2]">
                    {therapist.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={therapist.image} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/40 bg-gradient-to-tr from-[#3d5c50] to-[#b8c9be]">
                        {initials(name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1f2827]">
                      {name}
                    </h1>
                    <p className="text-sm text-[#8a9592] mt-1">Consultant Psychologist</p>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#5c6865]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4 text-[#2f745f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        B.A, M.Sc
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4 text-[#2f745f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {experienceLabel} of experience
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Therapist link copied to clipboard!");
                  }}
                  className="w-10 h-10 rounded-full border border-[#ebe8e2] text-[#5c6865] flex items-center justify-center hover:bg-[#faf9f6] transition shrink-0 shadow-xs self-start md:self-center"
                  aria-label="Share profile"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                </button>
              </div>

              {/* Video Introduction Box */}
              <div className="aspect-video w-full rounded-3xl overflow-hidden bg-[#e8ddd0] relative group shadow-sm">
                {therapist.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={therapist.image} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#3d5c50] to-[#b8c9be]" />
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/25 transition cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-white/95 text-[#2f745f] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
                    <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Biography Text Block */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <h3 className="font-display text-lg font-bold text-[#1f2827] mb-4">Biography</h3>
                <p className="text-xs sm:text-sm text-[#5c6865] leading-relaxed whitespace-pre-line">
                  {displayedBio}
                </p>
                {isBioLong && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mt-3 text-xs font-bold text-[#2f745f] hover:underline block"
                  >
                    {showFullBio ? "Read less ∧" : "Read more ∨"}
                  </button>
                )}
              </div>

              {/* Concerns I can help with */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12h8m-4-4v8" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1f2827]">Concerns I can help with</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    "I've been feeling really down lately, and it's affecting my daily life.",
                    "I've been feeling overwhelmed by anxiety lately.",
                    "I avoid social events, and I am self-conscious about my appearance."
                  ].map((quoteText, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe8e2]/60">
                      <span className="text-2xl text-[#2f745f] font-serif leading-none shrink-0">&ldquo;</span>
                      <p className="text-xs sm:text-sm text-[#5c6865] leading-relaxed italic">{quoteText}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* I offer therapy for categories carousel */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#1f2827]">I offer therapy for</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold">&lt;</button>
                    <button className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold">&gt;</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Relationship skills", color: "bg-red-50 text-red-500" },
                    { label: "Anger management", color: "bg-yellow-50 text-yellow-600" },
                    { label: "Self improvement", color: "bg-blue-50 text-blue-500" },
                    { label: "Parenting concerns", color: "bg-green-50 text-green-600" }
                  ].map((card, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-[#ebe8e2] bg-white flex flex-col items-center text-center hover:shadow-xs transition">
                      <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center mb-3`}>
                        <svg className="w-6 h-6 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="6" />
                          <path d="M12 9v6m-3-3h6" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-[#1f2827]">{card.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* I Specialise in */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.25 0h8.25" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1f2827]">I Specialise in</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {specializations.map((spec: string, index: number) => (
                    <div
                      key={index}
                      onClick={() => alert(`Showing info for modality: ${spec}`)}
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#ebe8e2] bg-white hover:border-[#2f745f]/40 hover:bg-[#faf9f6]/40 cursor-pointer transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 h-6 rounded-full bg-[#fdf6f0] text-[#e05a36] flex items-center justify-center font-display font-extrabold text-xs shrink-0 shadow-3xs">
                          {index + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#1f2827]">{spec}</span>
                      </div>
                      <span className="text-[#8a9592] text-xs font-bold font-mono shrink-0">&gt;</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages I speak */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1f2827]">Languages I speak</h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {(therapist.languages?.length > 0 ? therapist.languages : ["English", "Hindi"]).map((lang: string) => (
                    <span key={lang} className="flex items-center gap-1.5 px-4.5 py-2 rounded-full border border-[#ebe8e2] bg-[#fdf6f0]/40 text-xs font-bold text-[#1f2827] shadow-3xs">
                      <span className="text-[#2f745f]">✓</span> {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* My Affiliations */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1f2827]">My Affiliations</h3>
                </div>

                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3.5 text-xs sm:text-sm text-[#5c6865] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-[#eef6eb] text-[#2f745f] flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                    <span>Consultant Psychologist at Apna Healer from Aug 2023 to present</span>
                  </li>
                </ul>
              </div>

              {/* FAQs Carousel */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#1f2827]">FAQs</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFaqIndex((prev) => (prev === 0 ? MOCK_FAQS.length - 1 : prev - 1))}
                      className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() => setFaqIndex((prev) => (prev === MOCK_FAQS.length - 1 ? 0 : prev + 1))}
                      className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#faf9f6] border border-[#ebe8e2]/60 min-h-[160px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1f2827]">
                      {MOCK_FAQS[faqIndex].question}
                    </h4>
                    <p className="text-xs text-[#5c6865] mt-3 leading-relaxed whitespace-pre-line">
                      {MOCK_FAQS[faqIndex].answer}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-center gap-1.5">
                    {MOCK_FAQS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFaqIndex(idx)}
                        className={`h-1 rounded-full transition-all ${
                          faqIndex === idx ? "w-6 bg-[#2f745f]" : "w-1.5 bg-[#d1dcd7]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonials Carousel */}
              <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6eb] text-[#2f745f] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#1f2827]">Testimonials</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTestimonialIndex((prev) => (prev === 0 ? MOCK_TESTIMONIALS.length - 1 : prev - 1))}
                      className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() => setTestimonialIndex((prev) => (prev === MOCK_TESTIMONIALS.length - 1 ? 0 : prev + 1))}
                      className="w-7 h-7 rounded-full bg-[#f4f3ef] border border-[#ebe8e2] text-[#1f2827] flex items-center justify-center text-xs hover:bg-[#faf9f6] transition font-bold"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#faf9f6] border border-[#ebe8e2]/60 min-h-[150px] flex flex-col justify-between">
                  <div>
                    <span className="text-3xl text-[#2f745f]/30 font-serif leading-none block -mt-2">&ldquo;</span>
                    <p className="text-xs sm:text-sm text-[#5c6865] leading-relaxed italic -mt-2">
                      {MOCK_TESTIMONIALS[testimonialIndex].quote}
                    </p>
                  </div>
                  <div className="mt-5 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1f2827]">
                      {MOCK_TESTIMONIALS[testimonialIndex].author}
                    </span>
                    <div className="flex gap-1.5">
                      {MOCK_TESTIMONIALS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTestimonialIndex(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            testimonialIndex === idx ? "w-5 bg-[#2f745f]" : "w-1.5 bg-[#d1dcd7]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Center-Right Fixed Column (Sticky Booking Widget) */}
            <div className="lg:col-span-4">
              {isProvider ? (
                <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 shadow-[0_12px_44px_-16px_rgba(0,0,0,0.06)] space-y-4 text-center sticky top-24">
                  <h3 className="font-display text-lg font-bold text-[#1f2827]">Provider Account</h3>
                  <p className="text-sm text-[#5c6865]">
                    Professional provider account - booking therapist sessions is not available.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#ebe8e2] rounded-3xl p-6 shadow-[0_12px_44px_-16px_rgba(0,0,0,0.06)] space-y-6 sticky top-24">
                  
                  {/* Session Duration & Price */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[#8a9592]">Session Duration</span>
                      <span className="text-[#e05a36] bg-red-50 border border-red-100 rounded-lg px-2.5 py-1">
                        50 mins, 1 session
                      </span>
                    </div>
                    
                    <div className="border-t border-[#ebe8e2] my-4" />
                    
                    <div className="flex justify-between items-baseline">
                      <span className="text-[#1f2827] text-lg font-bold">
                        {therapist.hourlyRate ? `₹${therapist.hourlyRate}` : "₹2200"}
                      </span>
                      <span className="text-xs text-[#8a9592]">/ session</span>
                    </div>
                  </div>

                  {/* Date Picker slots */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a9592]">
                        Check available slots
                      </h4>
                      <button
                        onClick={() => alert("Showing full schedule calendar...")}
                        className="text-[#2f745f] hover:text-[#255c4b]"
                        aria-label="Full calendar"
                      >
                        <svg className="w-4.5 h-4.5 stroke-current fill-none" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </button>
                    </div>

                    {/* Horizontal Dates list */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {availableDates.map((item, idx) => (
                        <button
                          key={idx}
                          disabled={!item.available}
                          onClick={() => {
                            setSelectedDateIdx(idx);
                            setSelectedTimeSlot(null); // Reset time when date changes
                          }}
                          className={`flex-1 min-w-[76px] flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                            !item.available
                              ? "bg-[#faf9f6]/80 border-[#ebe8e2]/60 text-[#d1dcd7] cursor-not-allowed"
                              : selectedDateIdx === idx
                              ? "bg-[#2f745f] border-[#2f745f] text-white shadow-xs"
                              : "bg-white border-[#ebe8e2] text-[#1f2827] hover:border-[#2f745f]"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wide opacity-80">{item.day}</span>
                          <span className="text-xs font-extrabold mt-1">{item.label.split(" ")[0]}</span>
                          <span className={`text-[8px] font-semibold mt-1 block ${
                            selectedDateIdx === idx ? "text-white/90" : "text-[#8a9592]"
                          }`}>
                            {item.available ? `${item.slotsCount} available` : "not available"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Section */}
                  {selectedDateIdx !== null && (
                    <div>
                      <div className="flex justify-between items-baseline mb-3 text-xs font-semibold text-[#8a9592]">
                        <span>NOON</span>
                        <span className="text-[10px] font-bold">12:00 PM - 05:00 PM</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {mockTimeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTimeSlot(time)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                              selectedTimeSlot === time
                                ? "bg-[#2f745f] border-[#2f745f] text-white shadow-xs"
                                : "bg-white border-[#ebe8e2] text-[#1f2827] hover:border-[#2f745f]"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Action Button */}
                  <button
                    type="button"
                    onClick={beginJourney}
                    disabled={selectedDateIdx === null || selectedTimeSlot === null}
                    className={`w-full py-4 rounded-xl text-sm font-bold tracking-wide shadow-md transition-all ${
                      selectedDateIdx !== null && selectedTimeSlot !== null
                        ? "bg-[#2f745f] hover:bg-[#255c4b] text-white hover:shadow-lg"
                        : "bg-[#eceae6] border border-[#ebe8e2] text-[#8a9592] cursor-not-allowed shadow-none"
                    }`}
                  >
                    PROCEED
                  </button>

                </div>
              )}
            </div>

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
