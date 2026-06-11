"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import type { BookSessionHealer } from "@/components/dashboard/book-session-modal";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate } from "@/lib/display";
import type { ApiPublicTherapistDetail } from "@/types/api";

const DEFAULT_PHILOSOPHY_QUOTE =
  "Healing is not about fixing what is broken, but discovering the wholeness that was always there.";

const DEFAULT_BIO_FALLBACK =
  "My approach is rooted in the belief that every individual possesses an innate capacity for resilience. Through a collaborative, narrative-driven process, we explore the stories you tell yourself and gently rewrite the chapters that no longer serve your growth.";

const DEFAULT_EXPERIENCE_DESCRIPTION =
  "Dedicated to clinical practice with a focus on trauma, anxiety, and behavioral patterns—holding space for growth across every stage of life.";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
} as const;

function initials(name: string | null): string {
  if (!name) return "AH";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function displayNameWithTitle(name: string | null): string {
  const n = name ?? "Your Therapist";
  if (/^dr\.?\s/i.test(n)) return n;
  const parts = n.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? n;
  return `Dr. ${last}`;
}

function shortName(name: string | null): string {
  const n = name ?? "Therapist";
  return n.replace(/^Dr\.\s*/i, "").trim();
}

function heroIntro(therapist: ApiPublicTherapistDetail, name: string): string {
  if (therapist.profileDescription?.trim()) {
    return therapist.profileDescription.trim();
  }
  const base = `Guide, healer, and companion in your path to emotional equilibrium. ${name} specializes in bridging the gap between clinical excellence and soulful empathy.`;
  if (therapist.bio?.trim()) {
    return `${base} ${therapist.bio.trim().slice(0, 200)}`;
  }
  return base;
}

function testimonialText(therapist: ApiPublicTherapistDetail, lastName: string): string {
  if (therapist.testimonialQuote?.trim()) {
    return therapist.testimonialQuote.trim();
  }
  return `Working with ${lastName} felt like finally finding a compass in a storm. They don't just listen; they hear the things you haven't found words for yet.`;
}

type PendingBooking = { healer: BookSessionHealer } | null;

export function TherapistDetailPage() {
  const params = useParams<{ id: string }>();
  const therapistId = params.id;
  const { status } = useSession();
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
    queryFn: () => apiFetch<ApiPublicTherapistDetail>(`/api/public/providers/${therapistId}`),
    enabled: Boolean(therapistId),
  });

  const therapist = query.data;

  const specializations = useMemo(() => {
    return therapist?.specializations?.filter(Boolean) ?? [];
  }, [therapist?.specializations]);

  const certifications = useMemo(() => {
    return therapist?.certifications?.filter(Boolean) ?? [];
  }, [therapist?.certifications]);

  const experienceLabel = therapist?.experienceYears
    ? `${therapist.experienceYears}+ Years`
    : "12+ Years";

  const livesTouched = Math.max(
    therapist?.profileSessionCount ?? 0,
    therapist?.sessionCount ?? 0,
    120,
  );

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
    const healer: BookSessionHealer = {
      providerId: therapist.id,
      name: therapist.name ?? "Therapist",
      preferredRole: "THERAPIST",
      imageSrc: therapist.image,
      specialty: therapist.specializations[0] ?? "Therapist",
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
  const lastName = shortName(name);

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-8 md:px-10">
        <Link
          href="/therapists"
          className="text-sm font-semibold text-[#2f745f] transition hover:underline"
        >
          ← All therapists
        </Link>

        {query.isLoading ? (
          <div className="mt-12 space-y-8">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="h-64 animate-pulse rounded-3xl bg-[#e8e6e1]" />
              <div className="h-80 animate-pulse rounded-[40px] bg-[#e8e6e1]" />
            </div>
          </div>
        ) : query.error || !therapist ? (
          <div className="mt-12 rounded-2xl border border-dashed border-[#cfd4d2] bg-white px-8 py-16 text-center">
            <p className="text-lg font-semibold">Therapist not found</p>
            <Link href="/therapists" className="mt-4 inline-block text-sm font-semibold text-[#2f745f]">
              Browse all therapists
            </Link>
          </div>
        ) : (
          <>
            <motion.section
              className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
              initial="hidden"
              animate="show"
              variants={reveal}
            >
              <div>
                <motion.h1
                  className="font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#1f2827] md:text-5xl lg:text-6xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  A Journey with {displayNameWithTitle(name)}
                </motion.h1>
                <motion.p
                  className="mt-6 max-w-lg text-lg leading-8 text-[#5f6b69]"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                >
                  {heroIntro(therapist, name)}
                </motion.p>
                <motion.div
                  className="mt-8 flex flex-wrap items-center gap-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  <button
                    type="button"
                    onClick={beginJourney}
                    className="rounded-full bg-[#2f745f] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_32px_-14px_rgba(47,116,95,0.55)] transition hover:bg-[#245d4c]"
                  >
                    Begin Your Journey
                  </button>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#bcead8] text-sm font-bold text-[#2f745f]">
                    {initials(name)}
                  </span>
                </motion.div>
                {therapist.hourlyRate ? (
                  <p className="mt-4 text-sm font-semibold text-[#687471]">
                    Sessions from {formatCurrency(therapist.hourlyRate)}
                    {therapist.nextAvailabilityDate
                      ? ` · Next opening ${formatShortDate(therapist.nextAvailabilityDate)}`
                      : ""}
                  </p>
                ) : null}
              </div>

              <motion.div
                className="overflow-hidden rounded-[40px] shadow-[0_28px_56px_-32px_rgba(0,0,0,0.4)]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, duration: 0.6 }}
              >
                {therapist.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={therapist.image}
                    alt={name}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-[linear-gradient(145deg,#a3b18a,#3a5a40)] text-7xl font-semibold text-white/40">
                    {initials(name)}
                  </div>
                )}
              </motion.div>
            </motion.section>

            <motion.section
              className="mx-auto mt-24 max-w-3xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#687471]">
                Philosophy of Care
              </p>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-[#1f2827] md:text-4xl lg:text-5xl">
                &ldquo;{therapist.philosophyQuote?.trim() || DEFAULT_PHILOSOPHY_QUOTE}&rdquo;
              </h2>
              <p className="mt-8 text-lg leading-8 text-[#5f6b69]">
                {therapist.bio?.trim() || DEFAULT_BIO_FALLBACK}
              </p>
            </motion.section>

            <section className="mt-20 grid gap-6 lg:grid-cols-2">
              <motion.article
                className="rounded-[28px] bg-white p-8 shadow-[0_16px_40px_-32px_rgba(0,0,0,0.15)]"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-2xl" aria-hidden>
                  🎓
                </span>
                <h3 className="mt-4 text-3xl font-semibold text-[#1f2827]">{experienceLabel}</h3>
                <p className="mt-4 leading-relaxed text-[#5f6b69]">
                  {therapist.experienceDescription?.trim() || DEFAULT_EXPERIENCE_DESCRIPTION}
                </p>
                {certifications.length > 0 ? (
                  <ul className="mt-6 space-y-2">
                    {certifications.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#5f6b69]">
                        <span className="mt-0.5 text-[#2f745f]" aria-hidden>
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-8 text-sm font-semibold text-[#2f745f]">Clinical Excellence</p>
              </motion.article>

              {specializations.length > 0 ? (
                <motion.article
                  className="overflow-hidden rounded-[28px] bg-[#2f745f] text-white shadow-[0_16px_40px_-32px_rgba(0,0,0,0.2)]"
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid lg:grid-cols-[1fr_200px]">
                    <div className="p-8">
                      <h3 className="text-2xl font-semibold">Specializations</h3>
                      <ul className="mt-6 space-y-4">
                        {specializations.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm">
                            <span className="mt-0.5 text-[#bcead8]" aria-hidden>
                              ✓
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className="hidden min-h-[200px] bg-cover bg-center opacity-90 lg:block"
                      style={{
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80&auto=format&fit=crop)",
                      }}
                    />
                  </div>
                </motion.article>
              ) : null}
            </section>

            <motion.section
              className="mt-6 rounded-[28px] bg-[#e7dacd] p-8 md:p-10"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-[#4d4339] md:text-3xl">
                    Patient Impact
                  </h3>
                  <p className="mt-4 max-w-xl text-lg italic leading-relaxed text-[#5f4a42]">
                    &ldquo;{testimonialText(therapist, lastName)}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#74695f]">
                    — {therapist.testimonialAuthor?.trim() || "Community member"}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-sm">
                    <p className="text-3xl font-bold text-[#1f2827]">
                      {livesTouched >= 500 ? "500+" : `${livesTouched}+`}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#687471]">
                      Lives touched
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-sm">
                    <p className="text-3xl font-bold text-[#1f2827]">
                      {therapist.retentionRate?.trim() || "98%"}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#687471]">
                      Retention
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="relative mt-20 overflow-hidden rounded-[32px] bg-[#ececea] px-8 py-14 text-center md:px-14"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                aria-hidden
              >
                <svg className="h-full w-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <path
                    d="M0,100 Q200,40 400,100 T800,100"
                    fill="none"
                    stroke="#c5d0cd"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M0,120 Q200,160 400,120 T800,120"
                    fill="none"
                    stroke="#c5d0cd"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="relative">
                <h2 className="font-display text-3xl font-semibold text-[#1f2827] md:text-4xl">
                  Ready to take the first step?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[#5f6b69]">
                  Scheduling your first session is a conversation, not a form. Let&apos;s find
                  a time that works for your rhythm.
                </p>
                <motion.button
                  type="button"
                  onClick={beginJourney}
                  className="mx-auto mt-8 flex max-w-md items-center justify-center rounded-full bg-[#2f745f] px-10 py-4 text-base font-semibold text-white shadow-[0_10px_28px_-12px_rgba(47,116,95,0.5)]"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin with {lastName}
                </motion.button>
                <p className="mt-4 text-xs text-[#8a9492]">
                  Free 15 minute consultation available when offered by your therapist.
                </p>
              </div>
            </motion.section>
          </>
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
