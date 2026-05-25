import Link from "next/link";
import type { ClubDetail } from "@/data/clubs";

export function PublicClubDetailView({ club }: { club: ClubDetail }) {
  return (
    <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8 md:px-10">
      <section className="relative overflow-hidden rounded-[28px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={club.heroImage} alt={club.title} className="h-[260px] w-full object-cover md:h-[320px]" />
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/35 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Community Circle</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold text-white md:text-5xl">{club.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">{club.subtitle}</p>
          <div className="mt-4 flex gap-10">
            <div>
              <p className="text-3xl font-semibold text-[#b8e6d0]">{club.activeMembers}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Active Members</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-[#b8e6d0]">{club.weeklyEvents}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Weekly Events</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] bg-white p-6 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)]">
          <h2 className="text-2xl font-semibold text-[#243230]">Upcoming Circles</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {club.upcomingCircles.map((circle) => (
              <div key={circle.title} className="rounded-xl bg-[#f4f4f2] p-4">
                <p className="text-xs font-semibold uppercase text-[#2f745f]">
                  {circle.month} {circle.date} · {circle.mode}
                </p>
                <p className="mt-2 font-semibold text-[#243230]">{circle.title}</p>
                <p className="mt-1 text-xs text-[#5f6b69]">
                  {circle.time} · {circle.meta}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] bg-white p-6 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)]">
          <h2 className="text-2xl font-semibold text-[#243230]">Resident Healers</h2>
          <div className="mt-4 space-y-3">
            {club.residentHealers.map((healer) => (
              <div key={healer.name} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={healer.image} alt={healer.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-[#243230]">{healer.name}</p>
                  <p className="text-xs text-[#5f6b69]">{healer.role}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-full bg-[#2f745f] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Join Club
          </Link>
        </article>
      </section>
    </main>
  );
}
