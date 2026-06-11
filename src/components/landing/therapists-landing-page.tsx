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

const HERO_COLLAGE_IMAGES = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e7b?w=500&q=80&auto=format&fit=crop",
];

const CARD_GRADIENTS = [
  "bg-[linear-gradient(160deg,#c4d4c8,#3d5c50)]",
  "bg-[linear-gradient(160deg,#e8ddd0,#8b7355)]",
  "bg-[linear-gradient(160deg,#b8c9be,#4a6b5c)]",
];

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa5a2]";

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

function shortName(provider: ApiProvider): string {
  return (provider.name ?? "Therapist").replace(/^Dr\.\s*/i, "").trim();
}

function providerQuote(provider: ApiProvider): string {
  if (provider.bio?.trim()) {
    const sentence = provider.bio.trim().match(/^[^.!?]+[.!?]?/)?.[0]?.trim();
    if (sentence && sentence.length > 24) return sentence;
    return `${provider.bio.trim().slice(0, 160)}…`;
  }
  return "Healing isn't about fixing what's broken, but discovering the wholeness that was always there.";
}

function experienceTag(provider: ApiProvider): string {
  if (provider.sessionCount >= 200) return "15+ Years Exp.";
  if (provider.sessionCount >= 80) return "10+ Years Exp.";
  if (provider.sessionCount >= 20) return "5+ Years Exp.";
  return "8+ Years Exp.";
}

function specialtyPills(provider: ApiProvider): string[] {
  const pills = [experienceTag(provider)];
  if (provider.specializations[0]) pills.push(provider.specializations[0]);
  if (provider.specializations[1]) pills.push(provider.specializations[1]);
  else if (provider.languages[0]) pills.push(`Bilingual (${provider.languages[0]})`);
  return pills.slice(0, 3);
}

function roleLabel(index: number): string {
  if (index === 0) return "Lead Clinician";
  if (index % 3 === 1) return "Holistic Guide";
  return "Emerging Voice";
}

function matchesFilters(
  provider: ApiProvider,
  speciality: string,
  language: string,
  vibe: string,
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

  const spec = SPECIALITY_OPTIONS.find((o) => o.value === speciality);
  if (spec && spec.value !== "all" && "match" in spec && !spec.match.test(haystack)) return false;

  const v = VIBE_OPTIONS.find((o) => o.value === vibe);
  if (v && v.value !== "all" && "match" in v && !v.match.test(haystack)) return false;

  return true;
}

function FilterField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[140px] flex-1">
      <span className={fieldLabel}>{label}</span>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-[#ebe8e2] bg-[#faf9f6] px-4 py-3 pr-10 text-sm font-semibold text-[#1f2827] outline-none transition focus:border-[#2f745f]/40"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa5a2]">
          ▾
        </span>
      </div>
    </label>
  );
}

export function TherapistsLandingPage() {
  const { status } = useSession();
  const { open: openBookSession } = useBookSessionModal();
  const pendingBookingRef = useRef<PendingBooking | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const [speciality, setSpeciality] = useState("all");
  const [language, setLanguage] = useState("all");
  const [vibe, setVibe] = useState("all");
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
  const specialistCount = therapists.length > 0 ? `${therapists.length}+` : "100+";

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    therapists.forEach((t) => t.languages.forEach((l) => set.add(l)));
    return [
      { value: "all", label: "Any Language" },
      ...Array.from(set).sort().map((l) => ({ value: l, label: l })),
    ];
  }, [therapists]);

  const filtered = useMemo(
    () => therapists.filter((p) => matchesFilters(p, speciality, language, vibe)),
    [therapists, speciality, language, vibe],
  );

  const heroCollage = useMemo(() => {
    const fromApi = therapists
      .filter((t) => t.image)
      .slice(0, 4)
      .map((t) => t.image as string);
    while (fromApi.length < 4) {
      fromApi.push(HERO_COLLAGE_IMAGES[fromApi.length % HERO_COLLAGE_IMAGES.length]);
    }
    return fromApi;
  }, [therapists]);

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

  const scrollToList = () => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        {/* Hero */}
        <section className="mx-auto max-w-[1240px] px-6 pb-16 pt-12 md:px-10 md:pt-16 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial="hidden"
              animate="show"
              variants={reveal}
            >
              <h1 className="font-display text-5xl font-semibold leading-[1.06] tracking-[-0.03em] text-[#1f2827] md:text-6xl lg:text-[64px]">
                Guided by{" "}
                <span className="text-[#2f745f]">Compassion</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-[#6b7573] md:text-lg">
                Finding the right therapist is the most important step in your healing journey.
                Explore our curated sanctuary of diverse practitioners dedicated to your mental
                well-being.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <motion.button
                  type="button"
                  onClick={() => openTherapistBooking()}
                  className="rounded-full bg-[#2f745f] px-8 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_-14px_rgba(47,116,95,0.55)]"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Matching
                </motion.button>
                <motion.div
                  className="flex items-center gap-2 text-sm font-semibold text-[#5f6b69]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <span className="grid h-8 w-8 place-content-center rounded-full bg-[#e5efe9] text-[#2f745f]">
                    ✓
                  </span>
                  {specialistCount} Accredited Specialists
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="grid min-h-[380px] grid-cols-2 gap-4 md:min-h-[440px]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease }}
            >
              <div className="flex flex-col gap-4">
                {[0, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="overflow-hidden rounded-[28px] shadow-[0_20px_44px_-24px_rgba(0,0,0,0.35)]"
                    initial={{ opacity: 0, y: 24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.2 + i * 0.12, ease }}
                    whileHover={{ scale: 1.04, y: -4 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroCollage[i]}
                      alt=""
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <motion.div
                  className="overflow-hidden rounded-[28px] shadow-[0_20px_44px_-24px_rgba(0,0,0,0.35)]"
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: 0.32, ease }}
                  whileHover={{ scale: 1.04, y: -4 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroCollage[1]}
                    alt=""
                    className="aspect-[4/5] w-full object-cover"
                  />
                </motion.div>
                <motion.div
                  className="flex-1 overflow-hidden rounded-[28px] shadow-[0_20px_44px_-24px_rgba(0,0,0,0.35)]"
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: 0.44, ease }}
                  whileHover={{ scale: 1.04, y: -4 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroCollage[3]}
                    alt=""
                    className="h-full min-h-[200px] w-full object-cover md:min-h-[240px]"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="mx-auto max-w-[1240px] px-6 md:px-10">
          <motion.div
            className="flex flex-col gap-4 rounded-[24px] border border-[#ebe8e2] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.1)] md:flex-row md:items-end md:gap-6 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease }}
          >
            <FilterField
              label="Speciality"
              value={speciality}
              onChange={setSpeciality}
              options={SPECIALITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <FilterField
              label="Language"
              value={language}
              onChange={setLanguage}
              options={languageOptions}
            />
            <FilterField
              label="Vibe"
              value={vibe}
              onChange={setVibe}
              options={VIBE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <motion.button
              type="button"
              onClick={scrollToList}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1f2827] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2f3a38] md:mb-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Find my guide
            </motion.button>
          </motion.div>
        </section>

        {/* Therapist listings */}
        <section ref={listRef} className="mx-auto max-w-[1240px] scroll-mt-28 px-6 py-16 md:px-10 md:py-20">
          {providersQuery.isLoading ? (
            <div className="space-y-24">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[380px] animate-pulse rounded-[32px] bg-[#eceae6]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              className="rounded-[28px] border border-dashed border-[#d5dbd8] bg-white px-8 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-lg font-semibold text-[#1f2827]">No guides match these filters</p>
              <p className="mt-2 text-[#6b7573]">Try different speciality, language, or vibe.</p>
              <button
                type="button"
                onClick={() => {
                  setSpeciality("all");
                  setLanguage("all");
                  setVibe("all");
                }}
                className="mt-6 rounded-full bg-[#2f745f] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-24 md:space-y-32">
              <AnimatePresence mode="popLayout">
                {filtered.map((provider, index) => {
                  const layout = index % 3;
                  const name = displayName(provider);
                  const pills = specialtyPills(provider);
                  const quote = providerQuote(provider);
                  const imageUrl = provider.image;
                  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

                  if (layout === 0) {
                    return (
                      <LeadClinicianBlock
                        key={provider.id}
                        provider={provider}
                        name={name}
                        role={roleLabel(index)}
                        quote={quote}
                        pills={pills}
                        imageUrl={imageUrl}
                        gradient={gradient}
                        index={index}
                        onBook={() => openTherapistBooking(provider)}
                      />
                    );
                  }
                  if (layout === 1) {
                    return (
                      <HolisticGuideBlock
                        key={provider.id}
                        provider={provider}
                        name={shortName(provider)}
                        role={roleLabel(index)}
                        quote={quote}
                        pills={pills}
                        imageUrl={imageUrl}
                        gradient={gradient}
                        index={index}
                        onBook={() => openTherapistBooking(provider)}
                      />
                    );
                  }
                  return (
                    <EmergingVoiceBlock
                      key={provider.id}
                      provider={provider}
                      name={shortName(provider)}
                      quote={provider.bio ?? quote}
                      imageUrl={imageUrl}
                      gradient={gradient}
                      index={index}
                      onBook={() => openTherapistBooking(provider)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1240px] px-6 pb-24 md:px-10">
          <motion.div
            className="relative overflow-hidden rounded-[32px] bg-[#e5efe9] px-8 py-14 text-center md:px-16 md:py-16"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease }}
          >
            <span
              className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#bcead8]/60"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-[#bcead8]/50"
              aria-hidden
            />
            <motion.h2
              className="relative font-display text-3xl font-semibold tracking-[-0.02em] text-[#1e3d32] md:text-4xl"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Not sure where to start?
            </motion.h2>
            <motion.p
              className="relative mx-auto mt-4 max-w-xl text-base leading-8 text-[#3d5c50] md:text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
            >
              The journey to healing is deeply personal. Let our intuitive matching system guide
              you to the practitioner who best resonates with your unique story and needs.
            </motion.p>
            <motion.button
              type="button"
              onClick={() => openTherapistBooking()}
              className="relative mt-8 rounded-full bg-[#2f745f] px-10 py-4 text-sm font-semibold text-white shadow-[0_14px_36px_-14px_rgba(47,116,95,0.55)]"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.26 }}
            >
              Take the Introductory Questionnaire
            </motion.button>
          </motion.div>
        </section>
      </main>

      <LandingFooter />

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

function BookExploreActions({
  providerId,
  onBook,
}: {
  providerId: string;
  onBook: () => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-6">
      <motion.button
        type="button"
        onClick={onBook}
        className="rounded-full bg-[#2f745f] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(47,116,95,0.5)]"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        Book a Session
      </motion.button>
      <Link
        href={`/therapists/${providerId}`}
        className="text-sm font-semibold text-[#1f2827] transition hover:text-[#2f745f]"
      >
        Explore Practice →
      </Link>
    </div>
  );
}

function LeadClinicianBlock({
  provider,
  name,
  role,
  quote,
  pills,
  imageUrl,
  gradient,
  index,
  onBook,
}: {
  provider: ApiProvider;
  name: string;
  role: string;
  quote: string;
  pills: string[];
  imageUrl: string | null;
  gradient: string;
  index: number;
  onBook: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: index * 0.04, ease }}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
    >
      <Link
        href={`/therapists/${provider.id}`}
        className="relative block overflow-hidden rounded-[32px] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.38)]"
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35 }} className={`min-h-[360px] ${gradient}`}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-full min-h-[360px] w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
              {role}
            </p>
            <p className="mt-1 text-2xl font-semibold md:text-3xl">{name}</p>
          </div>
        </motion.div>
      </Link>

      <div className="relative lg:py-4">
        <span className="absolute -left-2 top-0 h-3 w-3 rounded-full bg-[#bcead8] md:-left-6" aria-hidden />
        <motion.blockquote
          className="font-display text-2xl font-semibold leading-snug tracking-[-0.02em] text-[#1f2827] md:text-3xl lg:text-[34px]"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
        >
          &ldquo;{quote}&rdquo;
        </motion.blockquote>
        {provider.bio ? (
          <p className="mt-6 border-l-2 border-[#bcead8] pl-5 text-sm leading-7 text-[#6b7573] md:text-base">
            {provider.bio.slice(0, 220)}
            {provider.bio.length > 220 ? "…" : ""}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-[#f0f0ed] px-4 py-2 text-xs font-semibold text-[#4a5553]"
            >
              {pill}
            </span>
          ))}
        </div>
        <BookExploreActions providerId={provider.id} onBook={onBook} />
      </div>
    </motion.article>
  );
}

function HolisticGuideBlock({
  provider,
  name,
  role,
  quote,
  pills,
  imageUrl,
  gradient,
  index,
  onBook,
}: {
  provider: ApiProvider;
  name: string;
  role: string;
  quote: string;
  pills: string[];
  imageUrl: string | null;
  gradient: string;
  index: number;
  onBook: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: index * 0.04, ease }}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
    >
      <div className="relative order-2 lg:order-1 lg:py-4">
        <span className="mb-6 inline-block h-3 w-3 rounded-full bg-[#bcead8]" aria-hidden />
        <motion.blockquote
          className="font-display text-2xl font-semibold leading-snug tracking-[-0.02em] text-[#1f2827] md:text-3xl"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          &ldquo;{quote}&rdquo;
        </motion.blockquote>
        {provider.bio ? (
          <p className="mt-6 border-l-2 border-[#bcead8] pl-5 text-sm italic leading-7 text-[#6b7573] md:text-base">
            {provider.bio.slice(0, 200)}
            {provider.bio.length > 200 ? "…" : ""}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-[#f0f0ed] px-4 py-2 text-xs font-semibold text-[#4a5553]"
            >
              {pill}
            </span>
          ))}
        </div>
        <BookExploreActions providerId={provider.id} onBook={onBook} />
      </div>

      <Link
        href={`/therapists/${provider.id}`}
        className="relative order-1 block overflow-hidden rounded-[32px] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.35)] lg:order-2"
      >
        <div className="h-4 bg-[#e8ddd0]" />
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35 }} className={`relative ${gradient}`}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="aspect-[4/5] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-6xl text-white/30">
              {name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-[#8b7355]/90 px-6 py-5 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
              {role}
            </p>
            <p className="mt-1 text-xl font-semibold text-white md:text-2xl">{name}</p>
          </div>
        </motion.div>
      </Link>
    </motion.article>
  );
}

function EmergingVoiceBlock({
  provider,
  name,
  quote,
  imageUrl,
  gradient,
  index,
  onBook,
}: {
  provider: ApiProvider;
  name: string;
  quote: string;
  imageUrl: string | null;
  gradient: string;
  index: number;
  onBook: () => void;
}) {
  const features = [
    provider.specializations[0] ?? "Affirming Care",
    provider.specializations[1] ?? "Narrative Therapy Specialist",
  ].filter(Boolean);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease }}
      className="overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_16px_48px_-32px_rgba(0,0,0,0.15)] md:p-10 lg:p-12"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-12">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2f745f]">
            {roleLabel(2)}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-[#1f2827] md:text-4xl">
            Meet {name}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#6b7573] md:text-base">
            {quote.slice(0, 280)}
            {quote.length > 280 ? "…" : ""}
          </p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium text-[#4a5553]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#c5ccc9]" />
                {f}
              </li>
            ))}
          </ul>
          <motion.button
            type="button"
            onClick={onBook}
            className="mt-8 rounded-full bg-[#1f2827] px-8 py-3.5 text-sm font-semibold text-white"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Connect with {name.split(" ")[0]}
          </motion.button>
        </div>

        <div className="relative mx-auto shrink-0 lg:mx-0">
          <Link href={`/therapists/${provider.id}`} className="relative block">
            <motion.div
              className={`relative h-44 w-44 overflow-hidden rounded-full ring-[6px] ring-white shadow-[0_20px_44px_-20px_rgba(0,0,0,0.35)] md:h-52 md:w-52 ${gradient}`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-5xl font-semibold text-white/40">
                  {name.charAt(0)}
                </span>
              )}
            </motion.div>
          </Link>
          <motion.div
            className="absolute -bottom-2 -left-4 z-10 max-w-[200px] rounded-2xl border border-[#ebe8e2] bg-white p-4 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.2)] md:-left-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm font-semibold text-[#2f745f]">Available Tomorrow</p>
            <p className="mt-1 text-xs leading-5 text-[#6b7573]">
              {name.split(" ")[0]} has open slots for initial consultations this week.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}
