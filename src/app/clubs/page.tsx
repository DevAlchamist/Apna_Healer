"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import type { ApiPublicClubSummary } from "@/types/api";

export default function ClubsLandingPage() {
  const clubsQuery = useQuery({
    queryKey: ["public-clubs"],
    queryFn: () => apiFetch<ApiPublicClubSummary[]>("/api/public/clubs"),
  });

  const clubs = clubsQuery.data ?? [];

  const [selectedTheme, setSelectedTheme] = useState<string>("All");

  const clubThemes = useMemo(() => {
    const uniqueSpheres = Array.from(new Set(clubs.map((c) => c.sphere).filter(Boolean)));
    return ["All", ...uniqueSpheres];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    if (selectedTheme === "All") return clubs;
    return clubs.filter((c) => c.sphere === selectedTheme);
  }, [clubs, selectedTheme]);

  const showFeatured = selectedTheme === "All";
  const featured = filteredClubs[0];
  const rest = showFeatured ? filteredClubs.slice(1) : filteredClubs;

  const revealUp = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  } as const;

  return (
    <div className="relative overflow-hidden bg-[#FBF8F3] text-[#33302B]">
      {/* Background Glowing Gradients matching Home Landing Page */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.55),transparent_65%)]" />
        <div className="absolute -right-24 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.5),transparent_65%)]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.45),transparent_65%)]" />
      </div>

      <LandingNavbar />

      <main className="relative z-10">
        {/* Hero Section */}
        <section aria-labelledby="circles-heading" className="border-b border-[#EAE3D8]">
          <div className="mx-auto grid max-w-[78rem] gap-8 px-6 py-20 lg:grid-cols-[1fr_0.8fr] lg:gap-20 lg:px-10 lg:py-24">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">Circles</p>
              <h1
                id="circles-heading"
                className="mt-5 max-w-[26ch] font-display text-[2.6rem] font-bold leading-[1.06] tracking-tight text-[#2E4739] sm:text-[3.2rem]"
              >
                Find a circle that moves at your pace.
              </h1>
            </div>
            <p className="max-w-[46ch] text-[1.05rem] leading-relaxed text-[#5F5A52] lg:pt-16 font-medium">
              Every circle here is small, held by a practitioner, and built around returning rather than attending
              once. Read a few, and join the one that feels like somewhere you could be quiet.
            </p>
          </div>
        </section>

        {/* Filter Section */}
        <section aria-label="Filter circles" className="border-b border-[#EAE3D8]">
          <div className="mx-auto flex max-w-[78rem] flex-wrap items-center gap-2.5 px-6 py-6 lg:px-10">
            {clubThemes.map((item) => {
              const isActive = item === selectedTheme;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedTheme(item)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-2 text-[0.82rem] font-bold transition duration-150 ease-out cursor-pointer ${
                    isActive
                      ? "bg-[#2E4739] text-[#FBF8F3]"
                      : "bg-[#E3ECE5]/40 text-[#5F5A52] hover:bg-[#E3ECE5]/80 hover:text-[#2E4739]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <p className="ml-auto text-xs text-[#8C867C] font-bold">
              {filteredClubs.length} {filteredClubs.length === 1 ? "circle" : "circles"}
            </p>
          </div>
        </section>

        {/* Cards Grid */}
        <div className="mx-auto max-w-[78rem] px-6 py-20 lg:px-10 lg:py-24">
          {clubsQuery.isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-[2rem] bg-[#E3ECE5]/20 border border-[#EAE3D8]" />
              ))}
            </div>
          ) : (
            <>
              {showFeatured && featured && (
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={revealUp}
                >
                  <FeaturedClubCard club={featured} />
                </motion.div>
              )}

              {rest.length > 0 && (
                <div className={showFeatured ? "mt-24 border-t border-[#EAE3D8] pt-16" : ""}>
                  {showFeatured && (
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold mb-10">All circles</p>
                  )}
                  <ul className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((club, index) => (
                      <li key={club.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.45, delay: Math.min(index, 3) * 0.06 }}
                          className="h-full"
                        >
                          <ClubItemCard club={club} />
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function FeaturedClubCard({ club }: { club: ApiPublicClubSummary }) {
  return (
    <article className="group grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <Link href={`/clubs/${club.id}`} className="block overflow-hidden rounded-[2rem] shadow-soft">
        <img
          src={club.heroImage}
          alt={club.title}
          className="h-80 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015] sm:h-[30rem]"
        />
      </Link>

      <div>
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">
          Circle of the season
        </p>
        <h2 className="mt-4 font-display text-[2.4rem] leading-[1.08] text-[#2E4739] font-bold sm:text-[3rem]">
          <Link
            href={`/clubs/${club.id}`}
            className="transition-colors duration-200 hover:text-[#1F3227] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E4739]"
          >
            {club.title}
          </Link>
        </h2>
        <p className="mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-[#5F5A52] font-medium">{club.subtitle}</p>

        <dl className="mt-8 grid gap-x-10 gap-y-4 border-t border-[#EAE3D8] pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Rhythm</dt>
            <dd className="mt-1.5 text-[0.9rem] leading-snug text-[#2E4739] font-semibold">Weekly</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Members</dt>
            <dd className="mt-1.5 text-[0.9rem] leading-snug text-[#2E4739] font-semibold">{club.activeMembers}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Weekly Events</dt>
            <dd className="mt-1.5 text-[0.9rem] leading-snug text-[#2E4739] font-semibold">{club.weeklyEvents}</dd>
          </div>
        </dl>

        <Link
          href={`/clubs/${club.id}`}
          className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-[#2E4739] hover:bg-[#1F3227] px-7 py-3.5 text-sm font-bold tracking-wide text-white transition duration-150 ease-out"
        >
          Enter the circle
          <ArrowRightIcon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function ClubItemCard({ club }: { club: ApiPublicClubSummary }) {
  return (
    <article className="group flex h-full flex-col justify-between">
      <div>
        <Link href={`/clubs/${club.id}`} className="block overflow-hidden rounded-[1.5rem] shadow-soft">
          <img
            src={club.heroImage}
            alt={club.title}
            className="h-56 w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] sm:h-60"
          />
        </Link>

        <p className="mt-6 text-[0.7rem] uppercase tracking-[0.16em] text-[#6E9179] font-bold">
          {club.sphere}
        </p>

        <h3 className="mt-3 font-display text-[1.5rem] leading-tight text-[#2E4739] font-bold">
          <Link
            href={`/clubs/${club.id}`}
            className="transition-colors duration-200 hover:text-[#1F3227]"
          >
            {club.title}
          </Link>
        </h3>

        <p className="mt-3 max-w-[42ch] text-[0.95rem] leading-relaxed text-[#5F5A52] font-medium">{club.subtitle}</p>
      </div>

      <div className="mt-auto pt-6">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[#EAE3D8] pt-4 text-xs text-[#8C867C] font-bold">
          <div>
            <dt className="sr-only">Cadence</dt>
            <dd>Weekly</dd>
          </div>
          <div>
            <dt className="sr-only">Members</dt>
            <dd>{club.activeMembers} members</dd>
          </div>
        </dl>

        <Link
          href={`/clubs/${club.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#6E9179] hover:text-[#2E4739] transition-colors duration-150 ease-out"
        >
          Enter the circle
          <ArrowRightIcon
            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            strokeWidth={1.6}
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}
