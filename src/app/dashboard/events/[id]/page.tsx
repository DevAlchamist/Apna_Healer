import { FadeIn } from "@/components/ui/fade-in";
import { eventDetails } from "@/data/events";
import { notFound } from "next/navigation";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = eventDetails.find((entry) => entry.id === id);

  if (!event) {
    notFound();
  }

  return (
    <FadeIn className="space-y-8 pb-6">
      <section className="relative overflow-hidden rounded-calm">
        <img src={event.heroImage} alt={event.title} className="h-[260px] w-full object-cover md:h-[360px]" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
            {event.category}
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-semibold leading-[0.98] md:text-6xl">{event.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            <p>{event.dateLabel}</p>
            <p>{event.timeLabel}</p>
            <p>{event.venue}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-7">
          <article className="rounded-calm bg-white p-6 shadow-soft md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">What to Expect</h2>
            <div className="mt-4 space-y-4 text-[1.02rem] leading-relaxed text-text-primary/74">
              {event.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-gentle bg-background p-5">
                <h3 className="text-3xl font-semibold text-text-primary">The Journey</h3>
                <ul className="mt-3 space-y-2.5 text-sm text-text-primary/74">
                  {event.journeyPoints.map((point) => (
                    <li key={point}>○ {point}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-gentle bg-background p-5">
                <h3 className="text-3xl font-semibold text-text-primary">Who it&apos;s For</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-primary/74">{event.audienceText}</p>
              </div>
            </div>
          </article>

          <section className="grid gap-5 xl:grid-cols-[1fr_230px]">
            <article className="rounded-calm bg-white p-6 shadow-soft md:p-7">
              <h2 className="font-display text-5xl font-semibold text-text-primary">About the Facilitator</h2>
              <div className="mt-5 flex flex-col gap-5 md:flex-row">
                <img src={event.facilitatorImage} alt={event.facilitatorName} className="h-36 w-36 rounded-gentle object-cover" />
                <div>
                  <h3 className="text-4xl font-semibold text-text-secondary">{event.facilitatorName}</h3>
                  <p className="text-base text-text-primary/75">{event.facilitatorRole}</p>
                  <p className="mt-3 text-[1.02rem] leading-relaxed text-text-primary/72">{event.facilitatorBio}</p>
                </div>
              </div>
            </article>

            <aside className="rounded-calm bg-text-secondary p-6 text-white shadow-soft">
              <h3 className="text-3xl font-semibold">Can&apos;t make this time?</h3>
              <p className="mt-2 text-sm text-white/85">
                Join the waitlist for future sessions or book a 1-on-1 private sound therapy session.
              </p>
              <button type="button" className="mt-5 text-sm font-semibold text-white underline-offset-4 hover:underline">
                Explore private sessions
              </button>
            </aside>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-5xl font-semibold text-text-primary">Community Reflections</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {event.reflections.map((reflection) => (
                <article
                  key={reflection.by}
                  className="rounded-calm bg-white p-6 shadow-soft"
                >
                  <p className="text-[1.02rem] leading-relaxed text-text-primary/80">&quot;{reflection.quote}&quot;</p>
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-text-primary">{reflection.by}</p>
                    <p className="text-xs text-text-primary/55">{reflection.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-calm bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-primary/65">Session Fee</p>
              <p className="font-display text-5xl font-semibold text-text-primary">{event.price}</p>
              <p className="text-xs text-text-primary/45">per person</p>
            </div>
            <div className="rounded-gentle bg-primary/10 px-3 py-1.5 text-xs font-semibold text-text-secondary">{event.seatsLeft}</div>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full bg-text-secondary px-5 py-3 text-base font-semibold text-white shadow-sm transition-shadow duration-300 hover:shadow-soft-hover"
          >
            Reserve Your Spot
          </button>

          <button type="button" className="mt-3 w-full rounded-full border border-accent/80 px-5 py-3 text-sm font-semibold text-text-primary/75">
            Add to Wishlist
          </button>

          <div className="mt-6 space-y-3 border-t border-accent/70 pt-5 text-sm text-text-primary/68">
            <p>Fully refundable up to 24h prior</p>
            <p>All equipment provided</p>
            <p>Intimate group (Max 20)</p>
          </div>
        </aside>
      </section>

      <footer className="space-y-5 rounded-calm bg-[#f2f2f2] p-8 text-center">
        <div className="mx-auto h-10 w-10 rounded-full bg-primary/35" />
        <p className="text-xl italic text-text-primary/72">&quot;The quieter you become, the more you are able to hear.&quot;</p>
        <div className="flex items-center justify-center gap-8 text-xs uppercase tracking-[0.14em] text-text-primary/55">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Accessibility</span>
        </div>
      </footer>
    </FadeIn>
  );
}
