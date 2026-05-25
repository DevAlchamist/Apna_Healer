import Link from "next/link";
import type { EventDetail } from "@/data/events";

type PublicEventView = EventDetail;

export function PublicEventDetailView({ event }: { event: PublicEventView }) {
  return (
    <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8 md:px-10">
      <section className="relative overflow-hidden rounded-[28px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.heroImage} alt={event.title} className="h-[280px] w-full object-cover md:h-[360px]" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
            {event.category}
          </span>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">{event.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
            <p>{event.dateLabel}</p>
            <p>{event.timeLabel}</p>
            <p>{event.venue}</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <article className="rounded-[24px] bg-white p-6 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)] md:p-8">
            <h2 className="text-3xl font-semibold text-[#243230]">What to Expect</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#5f6b69]">
              {event.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#f4f4f2] p-5">
                <h3 className="font-semibold text-[#243230]">The Journey</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#5f6b69]">
                  {event.journeyPoints.map((point) => (
                    <li key={point}>○ {point}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-[#f4f4f2] p-5">
                <h3 className="font-semibold text-[#243230]">Who it&apos;s For</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5f6b69]">{event.audienceText}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] bg-white p-6 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)]">
            <h2 className="text-2xl font-semibold text-[#243230]">About the Facilitator</h2>
            <div className="mt-4 flex flex-col gap-4 md:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.facilitatorImage}
                alt={event.facilitatorName}
                className="h-28 w-28 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold text-[#2f745f]">{event.facilitatorName}</h3>
                <p className="text-sm text-[#5f6b69]">{event.facilitatorRole}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5f6b69]">{event.facilitatorBio}</p>
              </div>
            </div>
          </article>
        </div>

        <aside className="h-fit rounded-[24px] bg-white p-6 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)]">
          <p className="text-sm text-[#5f6b69]">Session Fee</p>
          <p className="mt-1 text-4xl font-semibold text-[#243230]">{event.price}</p>
          <p className="text-xs text-[#5f6b69]">per person · {event.seatsLeft}</p>
          <Link
            href={`/?next=/dashboard/events/${event.id}`}
            className="mt-6 block w-full rounded-full bg-[#2f745f] px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Reserve Your Spot
          </Link>
        </aside>
      </section>
    </main>
  );
}
