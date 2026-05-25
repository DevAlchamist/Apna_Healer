"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingNavbar } from "@/components/landing/navbar";
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
    if (!club?.onboardingSteps?.length) return DEFAULT_FEATURES;
    return club.onboardingSteps.slice(0, 2).map((step, i) => ({
      title: step.question,
      description:
        club.purpose?.slice(0, 120) ??
        DEFAULT_FEATURES[i]?.description ??
        "A guided path into collective stillness.",
      icon: i === 0 ? "wind" : "leaf",
    }));
  }, [club]);

  const rituals = useMemo(() => {
    if (!club) return DEFAULT_RITUALS;
    if (club.onboardingSteps.length >= 2) {
      return club.onboardingSteps.slice(0, 2).map((step, i) => ({
        label: club.sphere.toUpperCase(),
        title: step.question,
        description:
          club.description?.slice(0, 200) ??
          DEFAULT_RITUALS[i]?.description ??
          "A sequence of collective movements designed to align spirit with rhythm.",
        image: gallery[i + 1] ?? DEFAULT_RITUALS[i]?.image ?? CIRCLE_IMAGE,
        cta: i === 0 ? "Explore session details" : "Join the circle",
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
    return club.reviews.slice(0, 2).map((r) => ({
      quote: r.quote,
      author: r.authorLabel,
      since: "Member",
    }));
  }, [club?.reviews]);

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
    window.location.href = `/dashboard/clubs/${club.slug}`;
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
      window.location.href = `/dashboard/clubs/${club.slug}`;
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

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />

      {query.isLoading ? (
        <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10">
          <div className="h-[70vh] animate-pulse rounded-[32px] bg-[#e8e6e1]" />
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
          <section className="relative min-h-[88vh] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#1a2e28]/30 via-transparent to-[#f9f7f2]" />
            <motion.div
              className="relative mx-auto flex min-h-[88vh] max-w-[900px] flex-col items-center justify-center px-6 pb-28 pt-32 text-center md:px-10"
              initial="hidden"
              animate="show"
              variants={reveal}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5a8f78]">
                {club.sphere} · breath is the bridge
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-6xl lg:text-7xl">
                {heroTitle.lead}
                <br />
                <span className="font-semibold italic text-[#2f745f]">{heroTitle.accent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#4a5654] md:text-base">
                {club.purpose ??
                  club.description ??
                  club.subtitle ??
                  "Step out of the noise. Reconnect with the natural rhythm of your breath in our digital atrium designed for collective stillness."}
              </p>
              <button
                type="button"
                onClick={scrollToPulse}
                className="mt-12 flex flex-col items-center gap-2 text-sm font-semibold text-[#2f745f] transition hover:text-[#245d4c]"
              >
                <span className="grid h-10 w-10 place-content-center rounded-full border border-[#2f745f]/40">
                  ↓
                </span>
                Begin the journey
              </button>
            </motion.div>
          </section>

          {/* Pulse of the collective */}
          <motion.section
            id="club-pulse"
            className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 md:py-28"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
          >
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-5xl">
                  The Pulse of the Collective
                </h2>
                <div className="mt-4 h-px w-16 bg-[#c5ccc9]" />
                <p className="mt-6 max-w-lg text-base leading-8 text-[#5f6b69]">
                  {club.description ??
                    club.purpose ??
                    "A living rhythm of breathwork, transformation, and ancient pranayama—woven together for those who seek stillness in community."}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {features.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-[20px] bg-[#f0f0ed] p-5"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#e5efe9]">
                        {f.icon === "wind" ? <WindIcon /> : <LeafIcon />}
                      </div>
                      <p className="font-semibold text-[#1f2827]">{f.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#5f6b69]">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div
                  className="aspect-[4/5] w-full rounded-[32px] bg-cover bg-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
                  style={{ backgroundImage: `url(${pulseImage})` }}
                />
                <div className="absolute -bottom-4 left-4 max-w-[280px] rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.25)] md:left-6">
                  <p className="text-sm italic leading-7 text-[#2f745f]">
                    &ldquo;Every inhale is a new beginning, every exhale a release of what no longer
                    serves.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Our Rituals */}
          <section className="bg-[#f9f7f2] py-8 md:py-16">
            <div className="mx-auto max-w-[1240px] px-6 md:px-10">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={reveal}
              >
                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-5xl">
                  Our Rituals
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#5f6b69]">
                  A sequence of collective movements, designed to align the spirit with the celestial
                  and circadian rhythms.
                </p>
              </motion.div>

              <div className="mt-14 space-y-20 md:space-y-28">
                {rituals.map((ritual, index) => {
                  const imageFirst = index % 2 === 0;
                  return (
                    <motion.div
                      key={ritual.title}
                      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                        imageFirst ? "" : "lg:[&>*:first-child]:order-2"
                      }`}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.15 }}
                      variants={reveal}
                    >
                      <div
                        className={`h-[280px] rounded-[32px] bg-cover bg-center md:h-[360px] ${
                          imageFirst ? "" : "lg:order-2"
                        }`}
                        style={{ backgroundImage: `url(${ritual.image})` }}
                      />
                      <div className={imageFirst ? "" : "lg:order-1"}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f745f]">
                          {ritual.label}
                        </p>
                        <h3 className="mt-3 font-display text-3xl font-semibold text-[#1f2827] md:text-4xl">
                          {ritual.title}
                        </h3>
                        <p className="mt-4 max-w-md text-base leading-8 text-[#5f6b69]">
                          {ritual.description}
                        </p>
                        <button
                          type="button"
                          onClick={joinSanctuary}
                          className="mt-6 text-sm font-semibold text-[#2f745f] underline underline-offset-4 transition hover:text-[#245d4c]"
                        >
                          {ritual.cta}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Upcoming Gatherings */}
          <motion.section
            className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 md:py-28"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={reveal}
          >
            <div className="text-center">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-5xl">
                Upcoming Gatherings
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5f6b69]">
                Join us from anywhere in the world. Our virtual atrium is always open for those
                seeking breath. {club.weeklyEventsLabel}
              </p>
            </div>

            {club.events.length === 0 ? (
              <p className="mt-12 text-center text-sm text-[#7a8583]">
                New gatherings are being scheduled. Join the sanctuary to be notified first.
              </p>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {club.events.map((event, i) => (
                  <article
                    key={event.slug}
                    className="flex flex-col rounded-[24px] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-[#e5efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2f745f]">
                        {event.mode === "Virtual" ? "Live session" : "Workshop"}
                      </span>
                      <span className="text-right text-[11px] font-medium text-[#5f6b69]">
                        {event.tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-[#1f2827]">{event.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-[#5f6b69]">
                      {event.description || `Hosted by ${event.host}.`}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0ed] text-xs font-semibold text-[#5f6b69]">
                        +{Math.max(event.seatsRemaining, 12)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          i === club.events.length - 1 && club.events.length > 1
                            ? openJoinModal()
                            : joinEventAsGuest(event.slug)
                        }
                        className="rounded-full bg-[#ebe8e0] px-5 py-2.5 text-sm font-semibold text-[#1f2827] transition hover:bg-[#e0ddd4]"
                      >
                        {i === club.events.length - 1 && club.events.length > 1
                          ? "Sign Up"
                          : "Join as Guest"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>

          {/* Voices from the Atrium */}
          <motion.section
            className="bg-[#1e3d32] py-20 md:py-28"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={reveal}
          >
            <div className="mx-auto max-w-[1240px] px-6 md:px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <h2 className="text-4xl font-semibold text-white md:text-5xl">
                  Voices from the Atrium
                </h2>
                <p className="max-w-md text-sm italic leading-7 text-white/75 md:text-right md:text-base">
                  &ldquo;The collective isn&apos;t just a club; it&apos;s a home for the soul&apos;s
                  primary function—the breath.&rdquo;
                </p>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {testimonials.map((t) => (
                  <div
                    key={t.author}
                    className="rounded-[24px] border border-white/10 bg-[#264a3d] p-8"
                  >
                    <span className="text-5xl font-serif leading-none text-[#5a8f78]">&ldquo;</span>
                    <p className="mt-2 text-base italic leading-8 text-white/90">{t.quote}</p>
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <p className="font-semibold text-white">{t.author}</p>
                      <p className="mt-1 text-sm text-white/50">Member since {t.since}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Final CTA */}
          <motion.section
            className="relative overflow-hidden py-28 md:py-36"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at center, transparent 0%, transparent 35%, rgba(47,116,95,0.06) 36%, transparent 37%, rgba(47,116,95,0.04) 50%, transparent 51%)",
              }}
            />
            <div className="relative mx-auto max-w-[720px] px-6 text-center md:px-10">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[#1f2827] md:text-5xl">
                Your sanctuary awaits.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-[#5f6b69]">
                Will you step inside? Join a global movement of conscious breathers and rediscover
                your own internal rhythm with {club.title}.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={joinSanctuary}
                  className="rounded-full bg-[#2f745f] px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_-14px_rgba(47,116,95,0.5)] transition hover:bg-[#245d4c]"
                >
                  Join the Sanctuary
                </button>
                <Link
                  href="/clubs"
                  className="rounded-full border border-[#cfd4d2] px-8 py-4 text-sm font-semibold text-[#2f745f] transition hover:border-[#2f745f]/40"
                >
                  Explore the Circles
                </Link>
              </div>
            </div>
          </motion.section>
        </>
      )}

      <LandingFooter />

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
