import { FadeIn } from "@/components/ui/fade-in";
import { clubDetails } from "@/data/clubs";
import { notFound } from "next/navigation";

function CircleCard({
  date,
  month,
  mode,
  title,
  time,
  meta,
}: {
  date: string;
  month: string;
  mode: string;
  title: string;
  time: string;
  meta: string;
}) {
  return (
    <article className="rounded-gentle bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-11 w-11 flex-col items-center justify-center rounded-gentle bg-primary/20 text-text-secondary">
          <span className="text-sm font-semibold leading-none">{date}</span>
          <span className="text-[9px] font-semibold leading-none tracking-wide">{month}</span>
        </div>
        <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-semibold text-text-primary/70">{mode}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs text-text-primary/62">
        {time} · {meta}
      </p>
      <button type="button" className="mt-4 w-full rounded-full bg-accent/55 py-2 text-sm font-semibold text-text-primary/80">
        Save Spot
      </button>
    </article>
  );
}

export default async function ClubDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const club = clubDetails.find((entry) => entry.id === id);

  if (!club) {
    notFound();
  }

  return (
    <FadeIn className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-calm border border-accent/70">
        <img src={club.heroImage} alt={club.title} className="h-[230px] w-full object-cover md:h-[280px]" />
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/35 to-black/25" />
        <div className="absolute inset-0 p-5 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Premium Club</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-semibold text-white md:text-6xl">{club.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/82 md:text-base">{club.subtitle}</p>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-10">
              <div>
                <p className="text-4xl font-semibold text-primary">{club.activeMembers}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Active Members</p>
              </div>
              <div>
                <p className="text-4xl font-semibold text-primary">{club.weeklyEvents}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Weekly Events</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <button type="button" className="rounded-full border border-white/40 bg-white/10 px-6 py-2 text-sm font-semibold text-white">
                Invite
              </button>
              <button type="button" className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white">
                Join Club
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-4xl font-semibold text-text-secondary">Upcoming Circles</h2>
              <button type="button" className="text-sm font-semibold text-text-secondary/85">
                View Calendar →
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {club.upcomingCircles.map((circle) => (
                <CircleCard key={circle.title} {...circle} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-4xl font-semibold text-text-secondary">Resident Healers</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {club.residentHealers.map((healer) => (
                <article
                  key={healer.name}
                  className="rounded-gentle bg-white p-4 text-center shadow-soft"
                >
                  <img src={healer.image} alt={healer.name} className="mx-auto h-16 w-16 rounded-full object-cover" />
                  <p className="mt-3 text-sm font-semibold text-text-primary">{healer.name}</p>
                  <p className="text-xs text-text-primary/55">{healer.role}</p>
                  <button type="button" className="mt-2 text-xs font-semibold text-text-secondary/85">
                    Profile ↗
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-calm bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-secondary">Member Reflections</h2>
            <button type="button" className="rounded-full border border-accent/80 p-1.5 text-text-primary/65">
              <span className="block h-4 w-4 text-sm leading-4">+</span>
            </button>
          </div>
          <div className="space-y-5">
            {club.reflections.map((reflection) => (
              <article key={reflection.by} className="border-b border-accent/60 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">{reflection.by}</p>
                  <p className="text-[10px] text-text-primary/45">{reflection.ago}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-primary/68">{reflection.quote}</p>
                <p className="mt-2 text-[11px] text-text-primary/48">
                  ♡ {reflection.likes} · Reply {reflection.replies}
                </p>
              </article>
            ))}
          </div>
          <button type="button" className="mt-5 text-xs font-semibold text-text-secondary/80">
            Read More Reflections
          </button>
        </aside>
      </section>
    </FadeIn>
  );
}

