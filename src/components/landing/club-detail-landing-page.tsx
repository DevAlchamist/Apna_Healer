"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import {
  Sunrise,
  NotebookPen,
  Users,
  MessageCircle,
  Footprints,
  HandHeart,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingNavbar } from "@/components/landing/navbar";
import { ClubJoinModal } from "@/components/clubs/club-join-modal";
import { apiFetch } from "@/lib/api-client";
import type { ApiPublicClubDetail } from "@/types/api";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80&auto=format&fit=crop";
const MEDITATION_IMAGE =
  "https://images.unsplash.com/photo-1506126613645-ec7d4b49df55?w=900&q=80&auto=format&fit=crop";
const CIRCLE_IMAGE =
  "https://images.unsplash.com/photo-1545205597-3b040aca5a69?w=900&q=80&auto=format&fit=crop";
const CANDLE_IMAGE =
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=900&q=80&auto=format&fit=crop";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
} as const;

const DEFAULT_FEATURES = [
  {
    title: "Pranayama Mastery",
    description:
      "Guided sessions rooted in ancient Vedic techniques to harmonize breath, body, and mind.",
    icon: "wind",
  },
  {
    title: "Stress Release",
    description:
      "Science-backed protocols designed to regulate the nervous system and restore calm.",
    icon: "leaf",
  },
] as const;

const DEFAULT_RITUALS = [
  {
    label: "THE AWAKENING",
    title: "Sunrise Flows",
    description:
      "Gentle activation sessions held as the world wakes. We use rhythmic breathing to clear the mind and prepare the body for the day's potential.",
    image: CIRCLE_IMAGE,
    cta: "Explore session details",
  },
  {
    label: "THE INTERNALIZATION",
    title: "Deep Dives",
    description:
      "Extended weekend workshops that delve into cellular release and emotional unwinding through Holotropic-inspired techniques.",
    image: CANDLE_IMAGE,
    cta: "Join the circle",
  },
] as const;

const FALLBACK_TESTIMONIALS = [
  {
    quote:
      "I came for the stress relief, but I stayed for the community. There is something profoundly healing about breathing in unison with others, even through a screen.",
    author: "Elena Vance",
    since: "2022",
  },
  {
    quote:
      "The Deep Dive sessions changed my relationship with my own body. I didn't realize how much I was holding onto until I was guided into quietude.",
    author: "Julian Thorne",
    since: "2023",
  },
] as const;

type PendingAction =
  | { type: "join" }
  | { type: "event"; slug: string }
  | null;

function WindIcon() {
  return (
    <svg className="h-5 w-5 text-[#2f745f]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 4C6.5 4 4 6.5 4 9.5M14.5 20C17.5 20 20 17.5 20 14.5M4 14.5H14.5M9.5 4H20M4 9.5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg className="h-5 w-5 text-[#2f745f]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3C8 8 6 12 6 16a6 6 0 0 0 12 0c0-4-2-8-6-13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getFeatureIcon(iconName: string) {
  switch (iconName) {
    case "Sunrise":
      return <Sunrise className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "NotebookPen":
      return <NotebookPen className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "Users":
      return <Users className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "MessageCircle":
      return <MessageCircle className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "Footprints":
      return <Footprints className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "HandHeart":
      return <HandHeart className="h-6 w-6 text-[#2f745f]" strokeWidth={1.3} aria-hidden />;
    case "leaf":
      return <LeafIcon />;
    case "wind":
    default:
      return <WindIcon />;
  }
}

function parseGatheringDate(startsAtStr?: string) {
  if (!startsAtStr) {
    return { day: "24", month: "OCT", weekday: "Thursday", time: "18:00" };
  }
  try {
    const d = new Date(startsAtStr);
    const day = d.getDate().toString();
    const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
    const weekday = d.toLocaleString("default", { weekday: "long" });
    const time = d.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { day, month, weekday, time };
  } catch (e) {
    return { day: "24", month: "OCT", weekday: "Thursday", time: "18:00" };
  }
}

function splitHeroTitle(title: string, subtitle: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length >= 3) {
    const mid = Math.ceil(words.length / 2);
    return {
      lead: words.slice(0, mid).join(" "),
      accent: words.slice(mid).join(" "),
    };
  }
  if (subtitle.trim()) {
    return { lead: title, accent: subtitle.trim() };
  }
  return { lead: "The Art of", accent: title };
}

export function ClubDetailLandingPage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;
  const { status } = useSession();
  const pendingRef = useRef<PendingAction>(null);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isClubJoinModalOpen, setIsClubJoinModalOpen] = useState(false);

  const query = useQuery({
    queryKey: ["public-club", slug],
    queryFn: () => apiFetch<ApiPublicClubDetail>(`/api/public/clubs/${slug}`),
    enabled: Boolean(slug),
  });

  const club = query.data;

  const heroImage = club?.heroImageUrl ?? HERO_FALLBACK;
  const gallery = club?.galleryUrls?.filter(Boolean) ?? [];
  const pulseImage = gallery[0] ?? MEDITATION_IMAGE;

  const heroTitle = useMemo(() => {
    if (!club) return { lead: "The Art of", accent: "Conscious Breathing" };
    return splitHeroTitle(club.title, club.subtitle);
  }, [club]);

  const features = useMemo(() => {
    if (club?.landingFeatures?.length) {
      return club.landingFeatures.slice(0, 2).map((f) => ({
        title: f.title,
        description: f.description,
        icon: f.icon,
      }));
    }
    return DEFAULT_FEATURES;
  }, [club?.landingFeatures]);

  const rituals = useMemo(() => {
    if (!club) return DEFAULT_RITUALS;
    if (club.landingRituals?.length) {
      return club.landingRituals.slice(0, 2).map((ritual, i) => ({
        label: ritual.label,
        title: ritual.title,
        description: ritual.description,
        image: ritual.imageUrl ?? gallery[i + 1] ?? DEFAULT_RITUALS[i]?.image ?? CIRCLE_IMAGE,
        cta: ritual.cta ?? (i === 0 ? "Explore session details" : "Join the circle"),
      }));
    }
    return DEFAULT_RITUALS.map((r, i) => ({
      ...r,
      description: club.purpose ?? club.description ?? r.description,
      image: gallery[i + 1] ?? r.image,
    }));
  }, [club, gallery]);

  const testimonials = useMemo(() => {
    if (!club?.reviews?.length) return FALLBACK_TESTIMONIALS;
    return club.reviews.slice(0, 4).map((r) => ({
      quote: r.quote,
      author: r.authorLabel,
      since: r.memberSince?.trim() || "Member",
    }));
  }, [club?.reviews]);

  const heroTagline = club?.heroTagline?.trim() || "breath is the bridge";
  const pulseQuote =
    club?.pulseQuote?.trim() ||
    "Every inhale is a new beginning, every exhale a release of what no longer serves.";
  const ritualsIntro =
    club?.ritualsIntro?.trim() ||
    "A sequence of collective movements, designed to align the spirit with the celestial and circadian rhythms.";
  const voicesQuote =
    club?.voicesQuote?.trim() ||
    "The collective isn't just a club; it's a home for the soul's primary function—the breath.";
  const finalCtaText =
    club?.finalCtaText?.trim() ||
    (club
      ? `Will you step inside? Join a global movement of conscious breathers and rediscover your own internal rhythm with ${club.title}.`
      : "Will you step inside? Join a global movement of conscious breathers and rediscover your own internal rhythm.");

  const openJoinModal = useCallback(() => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsSigningIn(false);
    setIsJoinModalOpen(true);
  }, []);

  const requireAuth = useCallback(
    (action: PendingAction) => {
      if (status === "authenticated") return true;
      pendingRef.current = action;
      openJoinModal();
      return false;
    },
    [status, openJoinModal],
  );

  const joinSanctuary = useCallback(() => {
    if (!club) return;
    if (!requireAuth({ type: "join" })) return;
    setIsClubJoinModalOpen(true);
  }, [club, requireAuth]);

  const joinEventAsGuest = useCallback(
    (eventSlug: string) => {
      if (!requireAuth({ type: "event", slug: eventSlug })) return;
      window.location.href = `/events/${eventSlug}`;
    },
    [requireAuth],
  );

  useEffect(() => {
    if (status !== "authenticated" || !pendingRef.current || !club) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending.type === "join") {
      setIsClubJoinModalOpen(true);
    } else if (pending.type === "event") {
      window.location.href = `/events/${pending.slug}`;
    }
  }, [status, club]);

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
      await signIn("google", { callbackUrl: `/clubs/${slug}` });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setIsSigningIn(false);
    }
  };

  const scrollToPulse = () => {
    document.getElementById("club-pulse")?.scrollIntoView({ behavior: "smooth" });
  };

  const isMember = status === "authenticated";

  // Testimonials Slider state
  const [voiceIndex, setVoiceIndex] = useState(0);
  const voice = testimonials[voiceIndex] || testimonials[0];

  const goVoice = (step: number) => {
    setVoiceIndex((current) => (current + step + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#33302B] relative overflow-hidden">
      {/* Background Glowing Gradients matching Home Landing Page */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.55),transparent_65%)]" />
        <div className="absolute -right-24 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.5),transparent_65%)]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.45),transparent_65%)]" />
      </div>

      <LandingNavbar onJoinClick={openJoinModal} />

      {query.isLoading ? (
        <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10">
          <div className="h-[70vh] animate-pulse rounded-[32px] bg-[#E3ECE5]/20 border border-[#EAE3D8]" />
        </div>
      ) : query.error || !club ? (
        <div className="mx-auto max-w-[1240px] px-6 py-24 text-center md:px-10">
          <p className="text-lg font-semibold">Circle not found</p>
          <Link href="/clubs" className="mt-4 inline-block text-sm font-semibold text-[#2f745f]">
            Browse all circles
          </Link>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="relative h-[92vh] min-h-[34rem] w-full overflow-hidden">
            <img
              src={heroImage}
              alt={club.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span
              className="absolute inset-0 bg-gradient-to-b from-[#1a2e28]/55 via-[#1a2e28]/45 to-[#1a2e28]/85"
              aria-hidden="true"
            />

            <div className="relative mx-auto flex h-full max-w-[78rem] flex-col justify-end px-6 pb-16 lg:px-10 lg:pb-20">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-[0.75rem] uppercase tracking-[0.2em] text-[#E3ECE5] font-bold"
              >
                {club.sphere} · {heroTagline}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.06 }}
                className="mt-6 max-w-[20ch] font-display text-[3rem] font-bold leading-[1.02] tracking-tight text-white sm:text-[4rem] lg:text-[4.75rem]"
              >
                {heroTitle.lead}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.12 }}
                className="mt-7 max-w-[38ch] font-display text-[1.35rem] leading-relaxed text-white/90 sm:text-[1.6rem]"
              >
                {club.subtitle || "A quiet space"} <em className="italic text-[#E3ECE5] font-medium">{heroTitle.accent}</em>
              </motion.p>

              <motion.button
                onClick={scrollToPulse}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.22 }}
                className="group mt-11 inline-flex w-fit items-center gap-3 rounded-full border border-white/35 px-6 py-3 text-sm tracking-wide text-white transition hover:border-white/70 hover:bg-white/10"
              >
                Begin the Journey
                <ArrowDown
                  className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-y-0.5"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </motion.button>
            </div>
          </section>

          {/* Pulse of the collective */}
          <section id="club-pulse" aria-labelledby="pulse-heading" className="scroll-mt-6 bg-[#FBF8F3] relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 py-20 lg:px-10 lg:py-28">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-20">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}>
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">The pulse of the collective</p>
                  <h2
                    id="pulse-heading"
                    className="mt-5 max-w-[22ch] font-display text-[2.1rem] leading-[1.14] text-[#2E4739] font-bold sm:text-[2.6rem]"
                  >
                    A place to be <em className="italic text-[#6E9179] font-medium">unedited</em> for a couple of hours a week.
                  </h2>
                </motion.div>

                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal} transition={{ delay: 0.08 }}>
                  <p className="max-w-[54ch] text-[1.05rem] leading-relaxed text-[#5F5A52] lg:pt-14 font-medium">
                    {club.purpose || club.description || "A living rhythm of breathwork, transformation, and pranayama—woven together for those who seek stillness in community."}
                  </p>
                </motion.div>
              </div>

              {/* Dynamic Feature Cards matching template background colors */}
              <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="h-full"
                  >
                    <article
                      className={`flex h-full flex-col rounded-[2rem] px-8 py-10 sm:px-10 border border-[#EAE3D8] shadow-sm ${index === 0 ? "bg-[#E3ECE5]/40" : "bg-[#EAE3D8]/30"
                        }`}
                    >
                      <div className="mb-4">
                        {getFeatureIcon(feature.icon ?? "wind")}
                      </div>
                      <h3 className="mt-2 max-w-[24ch] font-display text-[1.45rem] leading-snug text-[#2E4739] font-bold">
                        {feature.title}
                      </h3>
                      <p className="mt-4 max-w-[42ch] text-[0.98rem] leading-relaxed text-[#5F5A52] font-medium">
                        {feature.description}
                      </p>
                    </article>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Our Quote Callout */}
          <section aria-label="A member's words" className="bg-[#FBF8F3] relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 pb-24 lg:px-10">
              <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <figure className="relative">
                  <div className="overflow-hidden rounded-[2rem] shadow-soft">
                    <img
                      src={pulseImage}
                      alt="Members sitting together"
                      className="h-[22rem] w-full object-cover sm:h-[30rem]"
                    />
                    <span className="absolute inset-0" aria-hidden="true" />
                  </div>

                  <figcaption className="mx-5 -mt-16 rounded-[1.5rem] bg-[#FBF8F3] border border-[#EAE3D8] px-7 py-8 shadow-soft sm:mx-10 sm:-mt-20 sm:max-w-2xl sm:px-10 sm:py-10 lg:ml-16 relative z-20">
                    <blockquote className="space-y-4">
                      <p className="font-display text-[1.35rem] leading-[1.4] text-[#2E4739] font-bold sm:text-[1.65rem]">
                        &ldquo;{pulseQuote}&rdquo;
                      </p>
                      <footer className="text-sm text-[#8C867C] font-semibold">— Member Reflection</footer>
                    </blockquote>
                  </figcaption>
                </figure>
              </motion.div>
            </div>
          </section>

          {/* Our Rituals */}
          <section aria-labelledby="rituals-heading" className="border-t border-[#EAE3D8] bg-[#FBF8F3]/60 relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 py-20 lg:px-10 lg:py-28">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">Our rituals</p>
                <h2
                  id="rituals-heading"
                  className="mt-5 max-w-[26ch] font-display text-[2.1rem] leading-[1.15] text-[#2E4739] font-bold sm:text-[2.5rem]"
                >
                  The small practices that <em className="italic text-[#6E9179] font-medium">keep us together</em>.
                </h2>
              </motion.div>

              <ol className="mt-16 space-y-16 lg:space-y-24">
                {rituals.map((ritual, index) => {
                  const imageFirst = index % 2 === 0;
                  return (
                    <li key={ritual.title}>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                      >
                        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                          <figure className={`overflow-hidden rounded-[2rem] shadow-soft ${imageFirst ? "" : "lg:order-2"}`}>
                            <img
                              src={ritual.image}
                              alt={ritual.title}
                              className="h-72 w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.015] sm:h-[24rem]"
                            />
                          </figure>

                          <div className={imageFirst ? "" : "lg:order-1"}>
                            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">{ritual.label}</p>
                            <h3 className="mt-4 font-display text-[1.9rem] leading-tight text-[#2E4739] font-bold">{ritual.title}</h3>
                            <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-[#5F5A52] font-medium">
                              {ritual.description}
                            </p>
                            <button
                              type="button"
                              onClick={joinSanctuary}
                              className="group mt-7 inline-flex items-center gap-2 border-b border-[#2E4739]/30 pb-1 text-sm text-[#2E4739] font-bold transition duration-150 ease-out hover:border-[#2E4739]"
                            >
                              Join the circle
                              <ArrowRight
                                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                                strokeWidth={1.6}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* Upcoming Gatherings */}
          <section aria-labelledby="gatherings-heading" className="border-t border-[#EAE3D8] bg-[#FBF8F3] relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 py-20 lg:px-10 lg:py-24">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">Upcoming gatherings</p>
                <h2 id="gatherings-heading" className="mt-5 font-display text-[2.1rem] leading-tight text-[#2E4739] font-bold">
                  Come sit with us
                </h2>
              </motion.div>

              {club.events.length === 0 ? (
                <p className="mt-12 text-center text-sm text-[#8C867C] font-bold">
                  New gatherings are being scheduled. Join the sanctuary to be notified first.
                </p>
              ) : (
                <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {club.events.map((gathering, index) => {
                    const isFull = gathering.seatsRemaining === 0;
                    const dateParsed = parseGatheringDate(gathering.startsAt);
                    return (
                      <motion.div
                        key={gathering.slug}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: Math.min(index, 3) * 0.06 }}
                        className="h-full"
                      >
                        <li className="flex h-full flex-col justify-between rounded-[1.5rem] bg-[#E3ECE5]/30 border border-[#EAE3D8] px-6 py-7 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[#6E9179] font-bold">
                                {gathering.mode === "Virtual" ? "Live session" : "Workshop"}
                              </p>
                              <p className="text-right text-[0.72rem] uppercase tracking-[0.14em] text-[#5F5A52] font-semibold">
                                {dateParsed.day} {dateParsed.month}
                                <span className="block text-[#8C867C]">{dateParsed.weekday}</span>
                              </p>
                            </div>

                            <h3 className="mt-5 font-display text-[1.3rem] leading-snug text-[#2E4739] font-bold">{gathering.title}</h3>
                            <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[#5F5A52] font-medium">{gathering.description || `Hosted by ${gathering.host}.`}</p>
                          </div>

                          <div className="mt-auto pt-7">
                            <p className="border-t border-[#EAE3D8] pt-4 text-xs leading-relaxed text-[#8C867C] font-semibold">
                              {dateParsed.time} · with {gathering.host}
                              <span className="mt-1 block">
                                {isFull ? "Full — waiting list open" : `${gathering.seatsRemaining} seats open`}
                              </span>
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                index === club.events.length - 1 && club.events.length > 1
                                  ? openJoinModal()
                                  : joinEventAsGuest(gathering.slug)
                              }
                              className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-bold tracking-wide transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isFull
                                  ? "bg-[#EAE3D8] text-[#2E4739] hover:bg-[#D5CDC0]"
                                  : "bg-[#2E4739] text-white hover:bg-[#1F3227] focus-visible:outline-[#2E4739]"
                                }`}
                            >
                              {isFull ? "Join the waiting list" : "Sign up"}
                            </button>
                          </div>
                        </li>
                      </motion.div>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Voices from the Atrium Testimonial Slider */}
          <section aria-labelledby="voices-heading" className="bg-[#2E4739] py-20 md:py-28 relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 lg:px-10">
              <p id="voices-heading" className="text-[0.7rem] uppercase tracking-[0.18em] text-[#E3ECE5] font-bold">
                Voices from the atrium
              </p>

              {voice && (
                <div className="mt-10 min-h-[13rem] max-w-[52ch]">
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={voice.author}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <p className="font-display text-[1.6rem] leading-[1.35] text-white sm:text-[2rem] font-bold">
                        &ldquo;{voice.quote}&rdquo;
                      </p>
                      <footer className="mt-7 text-sm text-[#E3ECE5] font-semibold">
                        {voice.author} · <span className="text-white/60">Member since {voice.since}</span>
                      </footer>
                    </motion.blockquote>
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goVoice(-1)}
                  aria-label="Previous member voice"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => goVoice(1)}
                  aria-label="Next member voice"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                </button>
                <span className="ml-3 text-xs tracking-[0.14em] text-white/50 font-bold">
                  {voiceIndex + 1} / {testimonials.length}
                </span>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section aria-labelledby="invitation-heading" className="bg-[#FBF8F3] relative z-10">
            <div className="mx-auto max-w-[78rem] px-6 py-24 lg:px-10 lg:py-32">
              <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="mx-auto max-w-[34rem] text-center">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">The invitation</p>
                  <h2
                    id="invitation-heading"
                    className="mt-6 font-display text-[2.2rem] leading-[1.12] text-[#2E4739] font-bold sm:text-[2.75rem]"
                  >
                    There is a cushion here <em className="italic text-[#6E9179] font-medium">with your name on it</em>.
                  </h2>
                  <p className="mt-6 text-[1rem] leading-relaxed text-[#5F5A52] font-semibold">
                    {isMember
                      ? `Your seat in ${club.title} is waiting. Step inside for this week’s rituals and the gatherings you have booked.`
                      : "Joining takes a moment. You can stay quiet for as long as you like — being here is enough."}
                  </p>

                  <button
                    type="button"
                    onClick={joinSanctuary}
                    className="mt-10 rounded-full bg-[#2E4739] hover:bg-[#1F3227] px-9 py-4 text-sm font-bold tracking-wide text-white transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4739]"
                  >
                    {isMember ? "Enter your club space" : "Join this circle"}
                  </button>

                  <p className="mt-6 text-sm text-[#8C867C] font-semibold">
                    Not quite the right room?{" "}
                    <Link
                      href="/clubs"
                      className="border-b border-[#2E4739]/30 pb-0.5 text-[#2E4739] font-bold transition hover:border-[#2E4739] hover:text-[#1F3227]"
                    >
                      Explore other circles
                    </Link>
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      )}

      <LandingFooter />

      {club && (
        <ClubJoinModal
          club={club}
          open={isClubJoinModalOpen}
          onClose={() => setIsClubJoinModalOpen(false)}
        />
      )}

      <LandingJoinModal
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        modalMethod={modalMethod}
        onModalMethodChange={setModalMethod}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        otpCode={otpCode}
        onOtpCodeChange={setOtpCode}
        isOtpStage={isOtpStage}
        isSigningIn={isSigningIn}
        onGoogleSignIn={handleGoogleSignIn}
        onPhoneSubmit={(e) => e.preventDefault()}
        onOtpSubmit={(e) => e.preventDefault()}
      />
    </div>
  );
}
