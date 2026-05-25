"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";
import type { ApiPublicClubSummary, ApiPublicStats } from "@/types/api";

const SPHERE_COLORS = ["bg-[#bde6d7]", "bg-[#bde6d7]", "bg-[#e8ddcf]", "bg-[#e8ddcf]"];

const SPHERE_DESCRIPTIONS: Record<string, string> = {
  "Anxiety Support":
    "Finding calm in the chaos. These circles focus on grounding techniques, breathwork, and shared vulnerability.",
  "Mindful Movement":
    "Connecting mind and body through gentle flow, restorative yoga, and somatic healing practices.",
  "Grief Support":
    "Gentle spaces to honor loss, share memory, and rebuild meaning with others who understand.",
  "Nature & Stillness":
    "Outdoor walks, silence, and embodied presence to restore nervous system balance.",
  "Community Circle":
    "Open-hearted gatherings for connection, reflection, and mutual support.",
};

export default function ClubsLandingPage() {
  const clubsQuery = useQuery({
    queryKey: ["public-clubs"],
    queryFn: () => apiFetch<ApiPublicClubSummary[]>("/api/public/clubs"),
  });

  const statsQuery = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => apiFetch<ApiPublicStats>("/api/public/stats"),
  });

  const clubs = clubsQuery.data ?? [];
  const stats = statsQuery.data;

  const sphereCards = useMemo(() => {
    const bySphere = new Map<string, ApiPublicClubSummary[]>();
    for (const club of clubs) {
      const list = bySphere.get(club.sphere) ?? [];
      list.push(club);
      bySphere.set(club.sphere, list);
    }
    return [...bySphere.entries()].map(([sphere, items], index) => ({
      title: sphere,
      description:
        SPHERE_DESCRIPTIONS[sphere] ??
        "Curated therapist-guided circles for shared healing and growth.",
      action: `View ${items.length} Circle${items.length === 1 ? "" : "s"}`,
      iconColor: SPHERE_COLORS[index % SPHERE_COLORS.length],
      clubId: items[0]?.id,
    }));
  }, [clubs]);

  const activeCircles = clubs.slice(0, 3);
  const featuredClubs = clubs.slice(0, 2);
  const revealUp = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  } as const;

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar />
      <main>
        <motion.section
          className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-14 md:px-10 lg:grid-cols-2"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8f8a]">
              Community Circles
            </p>
            <h1 className="mt-4 text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#242d2c] md:text-7xl">
              Find Your
              <br />
              <span className="text-[#2f745f]">Tribe</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-[18px] leading-8 text-[#64706e]">
              Healing isn&apos;t a solitary journey. Join curated, therapist-guided
              circles designed to help you breathe, grow, and reconnect with
              others who understand your path.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#7b5d46,#ceb089)]" />
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#4f6659,#a6c2b2)]" />
                <div className="h-8 w-8 rounded-full border-2 border-[#f4f4f2] bg-[linear-gradient(145deg,#8ea5b4,#d2dde4)]" />
              </div>
              <p className="text-sm text-[#6d7876]">
                {stats
                  ? `${stats.activeTodayLabel} care providers active on the platform`
                  : "Join supportive circles across the community"}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
            className="mx-auto h-[420px] w-full max-w-[540px] rounded-[43%_57%_42%_58%/56%_45%_55%_44%] bg-[radial-gradient(circle_at_60%_24%,#f0dfba,#a88a64_48%,#5d4b37)] shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]"
          />
        </motion.section>

        <motion.section
          className="bg-[#f0efec] py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#222b2a]">
              Explore the Spheres
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] text-center text-[#737d7b]">
              We&apos;ve organized our circles into resonant spheres of support. No
              rigid boxes, just fluid spaces for exploration.
            </p>
            <div className="mt-11 grid gap-6 lg:grid-cols-3">
              {clubsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[260px] animate-pulse rounded-[30px] bg-white" />
                ))
              ) : sphereCards.length > 0 ? (
                sphereCards.map((card, index) => (
                  <motion.article
                    key={card.title}
                    className={`rounded-[30px] bg-white p-8 shadow-[0_16px_30px_-26px_rgba(0,0,0,0.45)] ${
                      index === 1 ? "lg:translate-y-8" : ""
                    }`}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className={`h-11 w-11 rounded-xl ${card.iconColor}`} />
                    <h3 className="mt-6 text-[37px] font-semibold tracking-[-0.02em] text-[#26302f]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-[#707b79]">
                      {card.description}
                    </p>
                    {card.clubId ? (
                      <Link
                        href={`/clubs/${card.clubId}`}
                        className="mt-6 inline-flex text-sm font-semibold text-[#2f745f]"
                      >
                        {card.action} →
                      </Link>
                    ) : null}
                  </motion.article>
                ))
              ) : (
                <p className="text-[#707b79] lg:col-span-3">
                  Community circles will appear here as they are published.
                </p>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[52px] font-semibold tracking-[-0.02em] text-[#222b2a]">
                  Active Circles
                </h2>
                <p className="mt-1 text-[#7a8583]">
                  Real-time pulses of communities breathing together.
                </p>
              </div>
              <a href="#" className="text-sm font-semibold text-[#2f745f]">
                See all live sessions →
              </a>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {activeCircles.map((club) => (
                <motion.article
                  key={club.id}
                  className="rounded-[24px] border border-[#e6e6e3] bg-white p-5"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="rounded-full bg-[#e5efe9] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2f745f]">
                    {club.sphere}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[#283231]">
                    {club.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#7a8582]">
                    {club.activeMembers} • {club.weeklyEvents}
                  </p>
                  <div
                    className="mt-6 h-14 w-14 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${club.heroImage})` }}
                  />
                  <Link
                    href={`/clubs/${club.id}`}
                    className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#f0f2f1] text-sm font-semibold text-[#2f745f]"
                  >
                    View Circle
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-6xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#242d2c] md:text-7xl">
              Selected
              <br />
              Community
              <br />
              <span className="text-[#2f745f]">Highlights</span>
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {featuredClubs.map((club) => (
                <motion.article key={club.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Link href={`/clubs/${club.id}`}>
                    <div
                      className="h-[500px] rounded-[32px] bg-cover bg-center p-6"
                      style={{ backgroundImage: `url(${club.heroImage})` }}
                    />
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#7d8986]">
                          {club.sphere}
                        </p>
                        <h3 className="mt-1 text-[44px] font-semibold tracking-[-0.02em] text-[#273230]">
                          {club.title}
                        </h3>
                        <p className="mt-3 max-w-[470px] text-[15px] leading-7 text-[#727d7b]">
                          {club.subtitle}
                        </p>
                      </div>
                      <span className="grid h-10 w-10 place-content-center rounded-full border border-[#9ac4b5] text-[#2f745f]">
                        ↗
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-6 pb-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-[1240px] rounded-[38px] bg-[#2f745f] px-8 py-14 text-center md:px-14"
          >
            <h2 className="text-[58px] font-semibold tracking-[-0.02em] text-white">
              Ready to find your circle?
            </h2>
            <p className="mx-auto mt-4 max-w-[620px] text-[18px] text-[#cde4dc]">
              Start your 14-day discovery pass. Connect with guides, join live
              sessions, and meet your community.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button className="rounded-full bg-white px-9 py-3 text-sm font-semibold text-[#2f745f]">
                Get Started Free
              </button>
              <button className="rounded-full border border-white/50 px-9 py-3 text-sm font-semibold text-white">
                Host a Circle
              </button>
            </div>
          </motion.div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
