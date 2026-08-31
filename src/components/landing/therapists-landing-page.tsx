"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  HeartIcon,
  LifeBuoyIcon,
  SparklesIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  SearchXIcon,
  ClipboardListIcon,
  ClockIcon,
  CheckIcon,
  LayersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
  StarIcon,
  LanguagesIcon,
  MapPinIcon,
} from "lucide-react";

import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import type { BookSessionHealer } from "@/components/dashboard/book-session-modal";
import { LandingFooter } from "@/components/landing/footer";
import { LandingJoinModal } from "@/components/landing/landing-join-modal";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import type { ApiProvider } from "@/types/api";

// ==========================================
// STATIC & MOCK DATA CONSTANTS
// ==========================================

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

interface DbPackage {
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
  allocations: {
    role: string;
    sessionCount: number;
  }[];
}

const therapyStories = [
  {
    id: "s-1",
    quote:
      "I had booked and cancelled therapy three times before this. Dr. Anaya opened with “we can just talk about your week if you like” and somehow that was enough to keep me coming back.",
    member: "Priya, 29",
    memberContext: "9 sessions · Anxiety & Stress",
    therapistName: "Dr. Anaya Kulkarni",
    therapistPhoto: "/2d19585d-dde1-4449-b1c2-34e410cbfbf2.jpg",
    rating: 5,
  },
  {
    id: "s-2",
    quote:
      "As a man in his forties, saying any of this out loud felt impossible. Imran never once made it feel dramatic. He just made room for it.",
    member: "Anonymous member",
    memberContext: "14 sessions · Grief",
    therapistName: "Dr. Imran Sheikh",
    therapistPhoto: "/1d3367b5-61c9-4648-bb01-3fa4d7309727.jpg",
    rating: 5,
  },
  {
    id: "s-3",
    quote:
      "I switched therapists after two sessions and nobody made me feel bad about it. Riya was the right fit and I’ve been with her for eight months now.",
    member: "Aditi, 24",
    memberContext: "22 sessions · Self-esteem",
    therapistName: "Riya Menon",
    therapistPhoto: "/1b305101-e75d-4490-a94e-f2cff0113199.jpg",
    rating: 5,
  },
  {
    id: "s-4",
    quote:
      "Somatic work sounded like nonsense to me until my shoulders unclenched for the first time in years. Dr. Nandita is patient with skeptics.",
    member: "Rohan, 36",
    memberContext: "11 sessions · Chronic stress",
    therapistName: "Dr. Nandita Iyer",
    therapistPhoto: "/2adb72fe-db83-4c41-942a-5ed65e6ffa2a.jpg",
    rating: 4,
  },
];

const therapyFaqs = [
  {
    id: "tf-1",
    question: "How do I know which therapist is right for me?",
    answer:
      "Start with what matters most to you — language, gender, area of expertise or budget — and use the filters above. If that still feels like a lot, our 2-minute FIT questionnaire asks a few gentle questions and shortlists three therapists we think you’ll feel at ease with.",
  },
  {
    id: "tf-2",
    question: "What actually happens in the first session?",
    answer:
      "Mostly conversation. Your therapist will ask what brought you here and what you’re hoping for, and you can share as little as you want. There’s no test, no diagnosis on day one, and no obligation to book a second session.",
  },
  {
    id: "tf-3",
    question: "Can I reschedule or cancel a session?",
    answer:
      "Yes. Reschedule or cancel free of charge up to 4 hours before your slot from your dashboard. Cancellations inside 4 hours are charged at 50%, and genuine emergencies are always waived — just message our care team.",
  },
  {
    id: "tf-4",
    question: "What if I don’t click with my therapist?",
    answer:
      "That happens more often than people admit, and it isn’t a failure. Tap “Find someone else” any time and we’ll rematch you within 24 hours, carrying over your preferences so you don’t have to explain yourself from scratch.",
  },
  {
    id: "tf-5",
    question: "How long is a session and how often should I come?",
    answer:
      "Sessions are 50 minutes. Most people start weekly for the first month, then move to fortnightly as things settle. Your therapist will suggest a rhythm, but the pace is always yours to set.",
  },
  {
    id: "tf-6",
    question: "Is any of this shared with my family or employer?",
    answer:
      "Never. Sessions are confidential and your notes belong to you alone. Nothing is shared without your written consent, and the only legal exception is an immediate risk to life — which your therapist will always try to discuss with you first.",
  },
];

interface EnrichedTherapist {
  id: string;
  name: string;
  photo: string;
  rating: string;
  reviews: number;
  credential: string;
  experience: string;
  specialties: string[];
  languages: string[];
  city: string;
  mode: string;
  nextSlot: string;
  price: number;
  rawProvider: ApiProvider;
}

export interface Filters {
  city: string;
  expertise: string;
  language: string;
  price: string;
  gender: string;
}

export const emptyFilters: Filters = {
  city: "All",
  expertise: "All",
  language: "All",
  price: "All",
  gender: "All",
};

const filterGroups = [
  { key: "city" as const, label: "Location centre", options: ["All", "Delhi NCR", "Gurgaon", "Bengaluru", "Mumbai"] },
  {
    key: "expertise" as const,
    label: "Expertise",
    options: ["All", "Anxiety & Stress", "Trauma & Grief", "Personal Growth", "Somatic & Body"],
  },
  {
    key: "language" as const,
    label: "Languages",
    options: ["All", "English", "Hindi", "Marathi", "Malayalam", "Tamil", "Kannada", "Punjabi", "Urdu"],
  },
  { key: "price" as const, label: "Price", options: ["All", "Under ₹1500", "₹1500–₹2000", "Over ₹2000"] },
  { key: "gender" as const, label: "Gender", options: ["All", "Female", "Male", "Non-binary"] },
];

const packageAccents = {
  sage: { badge: "bg-sage-500", btn: "bg-sage-600 hover:bg-sage-700", tick: "text-sage-600", chip: "bg-sage-100 text-sage-700" },
  lavender: {
    badge: "bg-lavender-500",
    btn: "bg-lavender-600 hover:bg-lavender-700",
    tick: "text-lavender-600",
    chip: "bg-lavender-100 text-lavender-700",
  },
  peach: { badge: "bg-peach-500", btn: "bg-peach-500 hover:bg-peach-600", tick: "text-peach-500", chip: "bg-peach-100 text-peach-600" },
};

// ==========================================
// CORE LAYOUT HELPER METHODS
// ==========================================

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
  expertise: string,
  language: string,
  city: string,
  priceBand: string,
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
  if (language !== "All" && !provider.languages.some((l) => l.toLowerCase() === language.toLowerCase())) {
    return false;
  }

  // Expertise filter
  if (expertise !== "All") {
    const spec = SPECIALITY_OPTIONS.find((o) => o.label === expertise);
    if (spec && "match" in spec && !spec.match.test(haystack)) return false;
  }

  // City filter
  if (city !== "All") {
    const cityRegex = new RegExp(city.replace(" NCR", ""), "i");
    if (!cityRegex.test(haystack) && !cityRegex.test(provider.bio || "")) {
      return false;
    }
  }

  // Price filter
  if (priceBand !== "All") {
    const rate = provider.hourlyRate ? parseFloat(provider.hourlyRate) : 1500;
    if (priceBand === "Under ₹1500" && rate >= 1500) return false;
    if (priceBand === "₹1500–₹2000" && (rate < 1500 || rate > 2000)) return false;
    if (priceBand === "Over ₹2000" && rate <= 2000) return false;
  }

  // Gender filter
  if (gender !== "All") {
    const bioText = (provider.bio ?? "").toLowerCase();
    const nameText = (provider.name ?? "").toLowerCase();
    if (gender === "Female") {
      const isFemale = /she\b|her\b|hers\b|dr\.\s+(saher|dyuti|sohini|shreemoyee|anaya|riya|nandita|gauri|kadambari|mallika)/i.test(
        bioText + " " + nameText,
      );
      if (!isFemale) return false;
    } else if (gender === "Male") {
      const isMale = /he\b|him\b|his\b|imran/i.test(bioText + " " + nameText) || (/dr\.\s+/i.test(nameText) && !/she\b|her\b/i.test(bioText));
      if (!isMale) return false;
    }
  }

  return true;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface WelcomeHeaderBannerProps {
  therapistCount: number;
  onLearn: () => void;
}

function WelcomeHeaderBanner({ therapistCount, onLearn }: WelcomeHeaderBannerProps) {
  const assurances = [
    { label: "Licence verified", icon: BadgeCheckIcon },
    { label: "Empathy screened", icon: HeartIcon },
    { label: "Switch anytime", icon: SparklesIcon },
  ];

  return (
    <section aria-labelledby="discovery-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-32 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.5),transparent_65%)]" />
        <div className="absolute -right-20 -top-16 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.45),transparent_65%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:pb-14 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50/80 px-4 py-2 text-xs font-medium text-ink-500 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
            {therapistCount} therapists accepting new members
          </span>

          <h1 id="discovery-title" className="mt-6 font-display text-4xl leading-[1.1] tracking-tight text-ink-900 sm:text-5xl font-semibold">
            Verifiable & <span className="italic text-sage-600 font-normal">Empathetic Guides</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
            Every therapist here is licence-checked, interviewed for warmth, and reviewed by real members. Take your time — browsing is
            free, and no one is notified until you decide to book.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {assurances.map((a) => (
              <li key={a.label} className="flex items-center gap-2 text-sm text-ink-700">
                <a.icon className="h-4 w-4 text-sage-600" strokeWidth={1.9} />
                {a.label}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.button
          type="button"
          onClick={onLearn}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="group mt-10 flex w-full items-center gap-4 rounded-4xl border border-peach-200/80 bg-peach-50 px-6 py-5 text-left transition hover:shadow-soft sm:w-auto cursor-pointer"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-50 text-peach-500">
            <LifeBuoyIcon className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink-900">Confused or have doubts?</span>
            <span className="mt-0.5 block text-sm text-ink-500">Learn how therapy helps — a 3-minute plain-language guide.</span>
          </span>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-peach-600 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </section>
  );
}

interface TherapistFilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}

function TherapistFilterBar({ filters, onChange, resultCount }: TherapistFilterBarProps) {
  const active = (Object.keys(filters) as (keyof Filters)[]).filter((k) => filters[k] !== "All");

  return (
    <div className="sticky top-[72px] z-30 border-y border-cream-300 bg-cream-100/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400 lg:hidden">
            <SlidersHorizontalIcon className="h-3.5 w-3.5" />
            Filter therapists
          </div>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {filterGroups.map((group) => {
              const isActive = filters[group.key] !== "All";
              return (
                <div key={group.key} className="relative shrink-0">
                  <label className="sr-only" htmlFor={`filter-${group.key}`}>
                    {group.label}
                  </label>
                  <select
                    id={`filter-${group.key}`}
                    value={filters[group.key]}
                    onChange={(e) => onChange({ ...filters, [group.key]: e.target.value })}
                    className={`w-full cursor-pointer appearance-none rounded-full border py-2.5 pl-4 pr-9 text-sm outline-none transition focus:ring-4 focus:ring-sage-100 ${isActive
                      ? "border-sage-300 bg-sage-50 text-sage-700"
                      : "border-cream-300 bg-cream-50 text-ink-500 hover:border-ink-400/30 hover:text-ink-700"
                      }`}
                  >
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "All" ? group.label : opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    className={`pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isActive ? "text-sage-600" : "text-ink-400"
                      }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <p className="text-sm text-ink-500">
              <span className="font-medium text-ink-900">{resultCount}</span> {resultCount === 1 ? "therapist" : "therapists"}
            </p>
            {active.length > 0 && (
              <button
                type="button"
                onClick={() => onChange(emptyFilters)}
                className="inline-flex items-center gap-1.5 rounded-full border border-peach-200 bg-peach-50 px-4 py-2 text-xs font-medium text-peach-600 transition hover:bg-peach-100 cursor-pointer"
              >
                <RotateCcwIcon className="h-3.5 w-3.5" />
                Reset filters ({active.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TherapistCardProps {
  therapist: EnrichedTherapist;
  index: number;
  onBookSession: (therapist: EnrichedTherapist) => void;
  onBookPackage: (therapist: EnrichedTherapist) => void;
}

function TherapistCard({ therapist, index, onBookSession, onBookPackage }: TherapistCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group flex flex-col w-full max-w-full overflow-hidden rounded-4xl border border-cream-300 bg-cream-50 p-5 transition-shadow duration-300 hover:shadow-soft"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee-exp {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-exp {
          display: flex;
          width: max-content;
          gap: 8px;
          animation: marquee-exp 16s linear infinite;
        }
        .animate-marquee-exp:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* Top Split Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
        {/* Left Video Thumbnail */}
        <div className="relative aspect-video w-full sm:w-[150px] max-h-[150px] max-w-[340px] shrink-0 overflow-hidden rounded-2xl bg-cream-200">
          <img
            src={therapist.photo}
            alt={`Portrait of ${therapist.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition cursor-pointer">
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-white bg-black/45 px-2 py-0.5 rounded-full backdrop-blur">
              Watch video
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-ink-900 shadow-sm shrink-0">
                <svg className="h-2 w-2 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </div>
          {/* Pagination dots bottom left */}
          <div className="absolute bottom-1.5 left-1.5 flex gap-1">
            <span className="h-1 w-2 rounded-full bg-white" />
            <span className="h-1 w-1 rounded-full bg-white/60" />
          </div>
        </div>

        {/* Right Info Details */}
        <div className="min-w-0 flex-1 text-left">
          <h3 className="font-display text-base sm:text-lg leading-snug text-ink-900 font-bold truncate">
            {therapist.name}
          </h3>
          <p className="mt-0.5 text-xs text-ink-500 font-medium">
            {therapist.experience} experience
          </p>
          <p className="mt-1 text-xs sm:text-sm text-ink-900 font-semibold">
            ₹{therapist.price} for 50 mins
          </p>
        </div>
      </div>

      {/* Expertise Infinite Scroll Marquee */}
      <div className="mt-4 flex items-center gap-2 overflow-hidden border-t border-cream-200 pt-3 w-full min-w-0">
        <span className="text-[11px] text-ink-400 font-semibold shrink-0">Expertise:</span>
        <div className="overflow-hidden flex-1 relative min-w-0">
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-cream-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-cream-50 to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-exp">
            {[...therapist.specialties, ...therapist.specialties].map((s, idx) => (
              <span
                key={`${s}-${idx}`}
                className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] text-ink-700 font-semibold shrink-0"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Speaks and static availability modes */}
      <div className="mt-2.5 text-left text-xs font-semibold">
        <p className="text-ink-500 font-medium">
          <span className="text-ink-400 font-semibold">Speaks:</span> {therapist.languages.join(", ")}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full border border-sage-500 bg-white px-2.5 py-0.5 text-[10px] font-bold text-sage-600">
            Online
          </span>
          <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-semibold text-ink-400">
            In-person
          </span>
        </div>

        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-1 text-ink-500 font-medium">
            <svg className="h-3.5 w-3.5 shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Video, Voice
          </p>
          <p className="text-ink-500 font-medium">
            Next online slot: <span className="text-lavender-600 font-bold">{therapist.nextSlot}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row gap-2 border-t border-cream-300 pt-4">
        <button
          onClick={() => onBookPackage(therapist)}
          className="flex-1 rounded-full border border-cream-300 bg-cream-50 hover:bg-cream-100 text-ink-700 hover:text-ink-900 py-2.5 text-center text-[10px] sm:text-xs font-bold transition uppercase tracking-wider cursor-pointer truncate"
        >
          Book package
        </button>
        <button
          type="button"
          onClick={() => onBookSession(therapist)}
          className="flex-1 rounded-full bg-lavender-600 hover:bg-lavender-700 text-cream-50 py-2.5 text-center text-[10px] sm:text-xs font-bold transition uppercase tracking-wider cursor-pointer truncate"
        >
          Book
        </button>
      </div>
      <Link
        type="button"
        href={`/therapists/${therapist.id}`}
        className="mt-2 block rounded-full bg-sage-600 hover:bg-sage-700 text-cream-50 py-2.5 text-center text-[10px] sm:text-xs font-bold transition uppercase tracking-wider cursor-pointer truncate"
      >
        View Profile
      </Link>
    </motion.article>
  );
}

function FitQuestionnaireBanner({ onStart }: { onStart: () => void }) {
  const steps = ["What’s bringing you here", "How you like to be supported", "Language, budget & timing"];

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="fit-title"
      className="relative overflow-hidden rounded-4xl border border-sage-100 bg-sage-50 p-8 sm:p-10"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(169,200,160,0.5),transparent_65%)]" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.45),transparent_65%)]" />
      </div>

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-500 text-cream-50">
            <ClipboardListIcon className="h-5 w-5" />
          </span>
          <h2 id="fit-title" className="mt-6 font-display text-2xl leading-snug text-ink-900 sm:text-3xl font-semibold">
            Not sure who to pick? Let us find your fit.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Answer nine gentle questions and we’ll shortlist three therapists suited to how you actually want to be supported. No
            diagnosis, no account needed, and nothing is shared with anyone.
          </p>

          <ul className="mt-6 space-y-2.5">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-ink-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-50 text-[11px] font-medium text-sage-700">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-600 px-8 py-4 text-sm font-semibold text-cream-50 transition hover:bg-sage-700 sm:w-auto cursor-pointer"
          >
            Take the FIT questionnaire
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <ClockIcon className="h-3.5 w-3.5" />
            About 2 minutes · pause anytime
          </p>
        </div>
      </div>
    </motion.section>
  );
}

interface TherapistsGridProps {
  therapists: EnrichedTherapist[];
  onBookSession: (therapist: EnrichedTherapist) => void;
  onBookPackage: (therapist: EnrichedTherapist) => void;
  onStartQuestionnaire: () => void;
  onReset: () => void;
}

function TherapistsGrid({ therapists, onBookSession, onBookPackage, onStartQuestionnaire, onReset }: TherapistsGridProps) {
  const bannerAfter = Math.min(3, therapists.length);
  const firstGroup = therapists.slice(0, bannerAfter);
  const secondGroup = therapists.slice(bannerAfter);

  return (
    <section aria-label="Available therapists" className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
      {therapists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-4xl border border-cream-300 bg-cream-50 px-8 py-14 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-ink-500">
            <SearchXIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-6 font-display text-xl text-ink-900 font-semibold">No one matches all of that just yet</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Try loosening one filter — or let the FIT questionnaire find someone close to what you’re looking for.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-7 rounded-full bg-sage-600 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-sage-700 cursor-pointer"
          >
            Reset filters
          </button>
        </motion.div>
      ) : (
        <div className="space-y-10">
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {firstGroup.map((t, i) => (
                <TherapistCard
                  key={t.id}
                  therapist={t}
                  index={i}
                  onBookSession={onBookSession}
                  onBookPackage={onBookPackage}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <FitQuestionnaireBanner onStart={onStartQuestionnaire} />

          {secondGroup.length > 0 && (
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {secondGroup.map((t, i) => (
                  <TherapistCard
                    key={t.id}
                    therapist={t}
                    index={i}
                    onBookSession={onBookSession}
                    onBookPackage={onBookPackage}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">{title}</h2>
      <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink-500">{description}</p>
    </div>
  );
}

interface WellnessPackagesProps {
  packages: Array<{
    id: string;
    title: string;
    description: string;
    cover: string;
    sessions: number;
    price: number;
    originalPrice: number;
    discount: number;
    accent: "sage" | "lavender" | "peach";
    includes: string[];
  }>;
  onBook: (pkg: any) => void;
}

function WellnessPackages({ packages, onBook }: WellnessPackagesProps) {
  return (
    <section id="packages" className="bg-cream-100/80 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Featured packages"
          title="Gentle journeys, priced kindly"
          description="Multi-session bundles for when you know you want to stay a while. Sessions never expire, and unused ones are always refundable."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, i) => {
            const a = packageAccents[pkg.accent];
            return (
              <motion.article
                key={pkg.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group flex flex-col overflow-hidden rounded-4xl border border-cream-300 bg-cream-50 transition-shadow duration-300 hover:shadow-soft"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={pkg.cover}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-semibold text-cream-50 ${a.badge}`}>
                    Save {pkg.discount}%
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${a.chip}`}>
                    <LayersIcon className="h-3.5 w-3.5" />
                    {pkg.sessions} sessions
                  </span>
                  <h3 className="mt-4 font-display text-xl leading-snug text-ink-900 font-semibold">{pkg.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{pkg.description}</p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                        <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${a.tick}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex items-end justify-between gap-3 border-t border-cream-300 pt-5">
                    <div>
                      <p className="flex items-baseline gap-2">
                        <span className="font-display text-xl text-ink-900 font-semibold">₹{pkg.price.toLocaleString("en-IN")}</span>
                        <span className="text-xs text-ink-400 line-through">₹{pkg.originalPrice.toLocaleString("en-IN")}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        ₹{Math.round(pkg.price / pkg.sessions).toLocaleString("en-IN")} per session
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBook(pkg)}
                      className={`rounded-full px-5 py-2.5 text-xs font-semibold text-cream-50 transition cursor-pointer ${a.btn}`}
                    >
                      Book package
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface TestimonialExperienceCarouselProps {
  stories: Array<{
    id: string;
    quote: string;
    member: string;
    memberContext: string;
    therapistName: string;
    therapistPhoto: string;
    rating: number;
  }>;
}

function TestimonialExperienceCarousel({ stories }: TestimonialExperienceCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const story = stories[index] || stories[0];

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + stories.length) % stories.length);
  };

  if (!story) return null;

  return (
    <section id="stories" className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Member experiences"
        title="How it went for people like you"
        description="Shared with consent, lightly edited for length. Names are changed whenever a member asks us to."
      />

      <div className="relative mt-14">
        <div className="relative overflow-hidden rounded-5xl border border-cream-300 bg-cream-50 px-7 py-10 sm:px-14 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.55),transparent_65%)]"
          />

          <QuoteIcon className="relative h-7 w-7 text-cream-300" fill="currentColor" />

          <div className="relative min-h-[240px] sm:min-h-[210px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.figure
                key={story.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -28 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <blockquote className="mt-6 font-display text-xl leading-relaxed text-ink-900 sm:text-2xl">{story.quote}</blockquote>

                <figcaption className="mt-9 flex flex-col gap-5 border-t border-cream-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{story.member}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{story.memberContext}</p>
                    <div className="mt-2 flex gap-0.5" aria-label={`${story.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <StarIcon
                          key={s}
                          className={`h-3.5 w-3.5 ${s < story.rating ? "fill-peach-400 text-peach-400" : "text-cream-300"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-3xl bg-lavender-50 px-4 py-3">
                    <img
                      src={story.therapistPhoto}
                      alt={`Portrait of ${story.therapistName}`}
                      className="h-11 w-11 rounded-full object-cover"
                    />

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-400">Worked with</p>
                      <p className="text-sm font-semibold text-ink-900">{story.therapistName}</p>
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-2" aria-hidden="true">
            {stories.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Story ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? "w-9 bg-ink-900" : "w-4 bg-ink-400/40 hover:bg-ink-400/70"
                  }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous story"
              className="rounded-full border border-cream-300 bg-cream-50 p-3 text-ink-500 transition hover:border-sage-200 hover:text-ink-900 cursor-pointer"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next story"
              className="rounded-full border border-cream-300 bg-cream-50 p-3 text-ink-500 transition hover:border-sage-200 hover:text-ink-900 cursor-pointer"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
}

function FaqAccordion({ items, id, eyebrow, title, description }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  return (
    <section id={id} className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">{eyebrow}</span>
        <h2 className="mt-3 font-display text-3xl leading-tight text-ink-900 sm:text-4xl font-semibold">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-500">{description}</p>
      </div>

      <div className="mt-14 space-y-3.5">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 transition-colors">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-ink-900 sm:text-base cursor-pointer"
              >
                {item.question}
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-200 text-ink-500 transition-transform duration-300">
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-sage-600" : ""}`} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="border-t border-cream-200/60 px-6 pb-6 pt-4 text-xs sm:text-sm leading-relaxed text-ink-500">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// MAIN LANDING PAGE COMPONENT
// ==========================================

export function TherapistsLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const { open: openBookSession } = useBookSessionModal();

  // Filters State
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // Modal lifecycle states
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // APIs data queries
  const providersQuery = useQuery({
    queryKey: ["public-therapists-landing"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/public/providers?role=THERAPIST&take=10"),
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

  // Enrich packages details dynamically
  const visiblePackages = useMemo(() => {
    return featuredPackages.map((pkg, index) => {
      const sessions = pkg.allocations.reduce((sum, alloc) => sum + alloc.sessionCount, 0) || 6;
      const priceNum = parseFloat(pkg.price);
      const originalPrice = pkg.discount > 0 ? Math.round(priceNum / (1 - pkg.discount / 100)) : priceNum;

      const accents: Array<"sage" | "peach" | "lavender"> = ["sage", "peach", "lavender"];
      const accent = accents[index % accents.length] || "sage";

      const includes = ["Matched therapist", `${sessions} private sessions`, "Guided check-ins & reflection workbook"];

      return {
        id: pkg.id,
        title: pkg.title,
        description: pkg.description || pkg.subtitle,
        cover: pkg.coverImage || "/32172744-8e83-4ed1-8fe4-194af3df12cb.jpg",
        sessions,
        price: priceNum,
        originalPrice,
        discount: pkg.discount || 20,
        accent,
        includes,
      };
    });
  }, [featuredPackages]);

  // Enrich therapists details dynamically based on search filter parameters
  const visibleTherapists = useMemo(() => {
    return therapists
      .filter((p) => matchesFilters(p, filters.expertise, filters.language, filters.city, filters.price, filters.gender))
      .map((t, index) => {
        const rating = (4.8 + (index % 3) * 0.1).toFixed(1);
        const reviews = 12 + (index * 7) % 40;

        let city = "Delhi NCR";
        if (/bengaluru|bangalore/i.test(t.bio || "")) city = "Bengaluru";
        else if (/mumbai|bombay/i.test(t.bio || "")) city = "Mumbai";
        else if (/gurgaon|gurugram/i.test(t.bio || "")) city = "Gurgaon";
        else {
          const cities = ["Delhi NCR", "Bengaluru", "Mumbai", "Gurgaon"];
          city = cities[index % cities.length] || "Delhi NCR";
        }

        const rate = t.hourlyRate ? parseFloat(t.hourlyRate) : 1500;

        let credential = "Licensed Clinical Psychologist";
        if (t.specializations.includes("Psychiatry")) credential = "Consultant Psychiatrist";
        else if (t.specializations.includes("Counseling")) credential = "Counselling Psychologist";

        let experience = "8+ years";
        if (t.sessionCount >= 200) experience = "15+ years";
        else if (t.sessionCount >= 80) experience = "10+ years";
        else if (t.sessionCount >= 20) experience = "5+ years";

        let nextSlot = "Tomorrow";
        if (t.nextAvailabilityDate) {
          const date = new Date(t.nextAvailabilityDate);
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
          const pad = (n: number) => n.toString().padStart(2, "0");

          const dayName = days[date.getDay()];
          const dayNum = date.getDate();
          const monthName = months[date.getMonth() % 12];

          let hours = date.getHours();
          const mins = pad(date.getMinutes());
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12;
          nextSlot = `${dayName}, ${dayNum} ${monthName} ${pad(hours)}:${mins} ${ampm}`;
        }

        return {
          id: t.id,
          name: displayName(t),
          photo: t.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80&auto=format&fit=crop",
          rating,
          reviews,
          credential,
          experience,
          specialties: t.specializations.length > 0 ? [...t.specializations] : ["Psychotherapy", "CBT"],
          languages: t.languages.length > 0 ? [...t.languages] : ["English", "Hindi"],
          city,
          mode: "Online & In-person",
          nextSlot,
          price: rate,
          rawProvider: t,
        };
      });
  }, [therapists, filters]);

  // Map local therapist-specific testimonies
  const mappedStories = useMemo(() => {
    return therapyStories.map((s, i) => {
      // Look for a therapist profile matching in names
      const match = therapists.find((p) => displayName(p).includes(s.therapistName));
      return {
        ...s,
        therapistPhoto: match?.image || s.therapistPhoto,
      };
    });
  }, [therapists]);

  // Auth & scroll effects
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

  const handleBookTherapist = (t: EnrichedTherapist) => {
    const healer: BookSessionHealer = {
      providerId: t.rawProvider.id,
      name: t.name,
      preferredRole: "THERAPIST",
      imageSrc: t.photo,
      specialty: t.specialties[0] || "Therapist",
    };

    if (status !== "authenticated") {
      openJoinModal();
    } else {
      openBookSession(healer);
    }
  };

  const handleBookTherapistPackage = (t: EnrichedTherapist) => {
    const healer: BookSessionHealer = {
      providerId: t.rawProvider.id,
      name: t.name,
      preferredRole: "THERAPIST",
      imageSrc: t.photo,
      specialty: t.specialties[0] || "Therapist",
      initialBookingOption: "PACKAGE",
    };

    if (status !== "authenticated") {
      openJoinModal();
    } else {
      openBookSession(healer);
    }
  };

  const handleBookPackage = (pkg: any) => {
    const healer: BookSessionHealer = {
      preferredRole: "THERAPIST",
      initialBookingOption: "PACKAGE",
      initialPackageId: pkg.id,
    };

    if (status !== "authenticated") {
      openJoinModal();
    } else {
      openBookSession(healer);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full bg-cream-100 text-ink-900">
      <LandingNavbar onJoinClick={openJoinModal} />

      <main>
        <WelcomeHeaderBanner therapistCount={therapists.length} onLearn={() => scrollTo("therapy-faqs")} />

        <TherapistFilterBar filters={filters} onChange={setFilters} resultCount={visibleTherapists.length} />

        <TherapistsGrid
          therapists={visibleTherapists}
          onBookSession={handleBookTherapist}
          onBookPackage={handleBookTherapistPackage}
          onStartQuestionnaire={openJoinModal}
          onReset={() => setFilters(emptyFilters)}
        />

        <WellnessPackages packages={visiblePackages} onBook={handleBookPackage} />

        <TestimonialExperienceCarousel stories={mappedStories} />

        <FaqAccordion
          items={therapyFaqs}
          id="therapy-faqs"
          eyebrow="Before you book"
          title="How therapy works here"
          description="Everything people usually ask before their first session. Our care team replies to anything else within a day."
        />
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
