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
import { formatCurrency } from "@/lib/display";
import type { ApiProvider } from "@/types/api";

const SPECIALTY_FILTERS = [
  { id: "all", label: "All Specialties" },
  { id: "anxiety", label: "Anxiety", match: /anxiety|stress|worry/i },
  { id: "trauma", label: "Trauma", match: /trauma|ptsd|grief|recovery/i },
  { id: "growth", label: "Growth", match: /growth|resilience|mindful|wellness|personal/i },
] as const;

const PORTRAIT_GRADIENTS = [
  "bg-[linear-gradient(145deg,#a3b18a,#3a5a40)]",
  "bg-[linear-gradient(145deg,#588157,#344e41)]",
  "bg-[linear-gradient(145deg,#7b9e87,#2d4a3e)]",
  "bg-[linear-gradient(145deg,#b5c99a,#52796f)]",
];

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
} as const;

type PendingBooking =
  | { type: "general" }
  | { type: "provider"; healer: BookSessionHealer };

function providerCategory(provider: ApiProvider): string {
  const spec = provider.specializations[0];
  if (spec) return spec.toUpperCase();
  return "WELLNESS & SUPPORT";
}

function providerQuote(provider: ApiProvider): string {
  if (provider.bio?.trim()) {
    const first = provider.bio.trim().split(/[.!?]/)[0]?.trim();
    if (first && first.length > 20) return `${first}.`;
    return provider.bio.trim().slice(0, 180);
  }
  return "A compassionate guide ready to walk beside you on your healing journey.";
}

function providerTags(provider: ApiProvider): string[] {
  const tags: string[] = [];
  provider.languages.slice(0, 2).forEach((l) => tags.push(l));
  if (provider.specializations[1]) tags.push(provider.specializations[1]);
  if (provider.sessionCount > 0) tags.push(`${provider.sessionCount}+ Sessions`);
  else if (provider.isVerified) tags.push("Verified");
  if (provider.hourlyRate) tags.push(`${formatCurrency(provider.hourlyRate)}/session`);
  return tags.slice(0, 4);
}

function matchesFilter(
  provider: ApiProvider,
  specialtyId: string,
  language: string,
): boolean {
  const haystack = [
    provider.name ?? "",
    provider.bio ?? "",
    ...provider.specializations,
    ...provider.languages,
  ]
    .join(" ")
    .toLowerCase();

  if (language !== "all" && !provider.languages.some((l) => l.toLowerCase() === language.toLowerCase())) {
    return false;
  }

  const filter = SPECIALTY_FILTERS.find((f) => f.id === specialtyId);
  if (filter && filter.id !== "all" && "match" in filter && !filter.match.test(haystack)) {
    return false;
  }

  return true;
}

export function TherapistsLandingPage() {
  const { status } = useSession();
  const { open: openBookSession } = useBookSessionModal();
  const pendingBookingRef = useRef<PendingBooking | null>(null);

  const [specialty, setSpecialty] = useState<string>("all");
  const [language, setLanguage] = useState("all");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const providersQuery = useQuery({
    queryKey: ["public-therapists-landing"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/public/providers?role=THERAPIST&take=24"),
  });

  const therapists = providersQuery.data ?? [];

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    therapists.forEach((t) => t.languages.forEach((l) => set.add(l)));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [therapists]);

  const filtered = useMemo(
    () => therapists.filter((p) => matchesFilter(p, specialty, language)),
    [therapists, specialty, language],
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
    if (pending.type === "provider") {
      openBookSession(pending.healer);
    } else {
      openBookSession({ preferredRole: "THERAPIST" });
    }
  }, [openBookSession]);

  useEffect(() => {
    if (status === "authenticated") {
      runPendingBooking();
    }
  }, [status, runPendingBooking]);

  useEffect(() => {
    document.body.style.overflow = isJoinModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isJoinModalOpen]);

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

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main>
        <motion.section
          className="mx-auto max-w-[900px] px-6 pb-10 pt-16 text-center md:px-10 md:pt-20"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="font-display text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#1f2827] md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            Guided by{" "}
            <span className="italic text-[#2f745f]">Compassion</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-[640px] text-lg leading-8 text-[#5d6664] md:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
          >
            Begin your journey toward emotional clarity within our digital atrium—a quiet
            space designed to connect you with healers who listen with their hearts.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {SPECIALTY_FILTERS.map((chip) => {
              const active = specialty === chip.id;
              return (
                <motion.button
                  key={chip.id}
                  type="button"
                  variants={staggerItem}
                  onClick={() => setSpecialty(chip.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#2f745f] text-white shadow-[0_8px_24px_-12px_rgba(47,116,95,0.55)]"
                      : "bg-[#ececea] text-[#4a5553] hover:bg-[#e2e0dc]"
                  }`}
                >
                  {chip.label}
                </motion.button>
              );
            })}
            <motion.label
              variants={staggerItem}
              className="flex items-center gap-2 rounded-full bg-[#ececea] px-4 py-2.5 text-sm font-semibold text-[#4a5553]"
            >
              <span aria-hidden>🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="cursor-pointer bg-transparent outline-none"
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "all" ? "Language" : lang}
                  </option>
                ))}
              </select>
            </motion.label>
          </motion.div>
        </motion.section>

        <section className="mx-auto max-w-[1100px] px-6 pb-20 md:px-10">
          {providersQuery.isLoading ? (
            <div className="space-y-16">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
                    i % 2 === 1 ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  <div className="h-[340px] animate-pulse rounded-[40px] bg-[#e8e6e1] lg:[direction:ltr]" />
                  <div className="space-y-4 lg:[direction:ltr]">
                    <div className="h-4 w-32 animate-pulse rounded bg-[#e8e6e1]" />
                    <div className="h-10 w-64 animate-pulse rounded bg-[#e8e6e1]" />
                    <div className="h-20 animate-pulse rounded bg-[#e8e6e1]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filtered.map((provider, index) => {
                const imageFirst = index % 2 === 0;
                const displayName = provider.name ?? "Verified Therapist";
                const shortName = displayName.replace(/^Dr\.\s*/i, "").split(" ")[0] ?? displayName;

                const portrait = (
                  <Link
                    href={`/therapists/${provider.id}`}
                    className="relative block overflow-hidden rounded-[40px] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.35)] transition hover:shadow-[0_28px_52px_-28px_rgba(0,0,0,0.42)]"
                  >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div
                      className={`aspect-[4/5] max-h-[420px] w-full ${PORTRAIT_GRADIENTS[index % PORTRAIT_GRADIENTS.length]}`}
                    >
                      {provider.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={provider.image}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-end p-8">
                          <span className="text-6xl font-semibold text-white/30">
                            {displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  </Link>
                );

                const copy = (
                  <div className="lg:py-4">
                      <motion.p
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f745f]"
                        initial={{ opacity: 0, x: imageFirst ? -12 : 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                      >
                        {providerCategory(provider)}
                      </motion.p>
                      <motion.h2
                        className="mt-3 font-display text-4xl font-semibold tracking-[-0.02em] text-[#1f2827] md:text-5xl"
                        initial={{ opacity: 0, x: imageFirst ? -16 : 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                      >
                        <Link
                          href={`/therapists/${provider.id}`}
                          className="transition hover:text-[#2f745f]"
                        >
                          {displayName}
                        </Link>
                      </motion.h2>
                      <motion.p
                        className="mt-5 text-lg italic leading-relaxed text-[#5f6b69] md:text-xl"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.22 }}
                      >
                        &ldquo;{providerQuote(provider)}&rdquo;
                      </motion.p>
                      <motion.div
                        className="mt-6 flex flex-wrap gap-2"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                      >
                        {providerTags(provider).map((tag) => (
                          <motion.span
                            key={tag}
                            variants={staggerItem}
                            className="rounded-full bg-[#ececea] px-3 py-1.5 text-xs font-semibold text-[#4a5553]"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </motion.div>
                      <motion.div
                        className="mt-8 flex flex-wrap gap-3"
                        whileHover={{ y: -2 }}
                      >
                        <Link
                          href={`/therapists/${provider.id}`}
                          className="rounded-full bg-[#2f745f] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_32px_-14px_rgba(47,116,95,0.6)] transition hover:bg-[#245d4c]"
                        >
                          View profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => openTherapistBooking(provider)}
                          className="rounded-full border border-[#2f745f] px-8 py-4 text-base font-semibold text-[#2f745f] transition hover:bg-[#2f745f]/10"
                        >
                          Book session
                        </button>
                      </motion.div>
                  </div>
                );

                return (
                  <motion.article
                    key={provider.id}
                    layout
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
                  >
                    {imageFirst ? (
                      <>
                        {portrait}
                        {copy}
                      </>
                    ) : (
                      <>
                        {copy}
                        {portrait}
                      </>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          ) : (
            <motion.div
              className="rounded-[32px] border border-dashed border-[#cfd4d2] bg-white/60 px-8 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-lg font-semibold text-[#1f2827]">No therapists match these filters</p>
              <p className="mt-2 text-[#687471]">Try another specialty or language, or browse all healers.</p>
              <button
                type="button"
                onClick={() => {
                  setSpecialty("all");
                  setLanguage("all");
                }}
                className="mt-6 rounded-full bg-[#2f745f] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
            </motion.div>
          )}
        </section>

        <motion.section
          className="mx-auto max-w-[900px] px-6 pb-24 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="rounded-[36px] bg-white px-8 py-12 text-center shadow-[0_20px_50px_-35px_rgba(0,0,0,0.2)] md:px-14 md:py-14">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-[#1f2827] md:text-4xl">
              Not sure where to start?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#5f6b69] md:text-lg">
              Take our guided booking flow. We&apos;ll help match you with a healer who
              specializes in your specific journey.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={() => openTherapistBooking()}
                className="rounded-full bg-[#2f745f] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(47,116,95,0.55)]"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Your Match
              </motion.button>
              <Link
                href="/"
                className="rounded-full border border-[#d8d4cc] bg-white px-8 py-3.5 text-sm font-semibold text-[#3e4b4a] transition hover:border-[#2f745f]/40"
              >
                Back to home
              </Link>
            </div>
          </div>
        </motion.section>
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
