import Link from "next/link";
import { ArrowRightIcon, ChevronLeftIcon, PlayIcon } from "lucide-react";
import type { EventDetail } from "@/data/events";

type PublicEventView = EventDetail;

export function PublicEventDetailView({ event }: { event: PublicEventView }) {
  const isUpcoming = event.status !== "COMPLETED";

  return (
    <div className="relative overflow-hidden bg-[#FBF8F3] text-[#33302B]">
      {/* Background Glowing Gradients matching Home Landing Page */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,223,195,0.55),transparent_65%)]" />
        <div className="absolute -right-24 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(218,209,240,0.5),transparent_65%)]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(247,212,189,0.45),transparent_65%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[78rem] px-6 py-8 lg:px-10">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-[#5F5A52] transition-colors duration-150 ease-out hover:text-[#2E4739] mb-8 font-semibold"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          All events
        </Link>

        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20 pb-16 pt-6 lg:pb-20 lg:pt-10 border-b border-[#EAE3D8]">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.78rem] uppercase tracking-[0.18em] font-bold">
                <span className="text-[#6E9179]">{event.category}</span>
                <span className="h-3 w-px bg-[#EAE3D8]" aria-hidden="true" />
                {!isUpcoming ? (
                  <span className="text-[#8C867C]">Completed Gathering</span>
                ) : (
                  <span className="text-[#8C867C]">{event.seatsLeft}</span>
                )}
              </div>

              <h1 className="mt-7 max-w-[22ch] font-display text-[2.6rem] font-bold leading-[1.06] tracking-tight text-[#2E4739] sm:text-[3.2rem] lg:text-[3.6rem]">
                {event.title}
              </h1>

              <p className="mt-7 max-w-[46ch] text-[1.05rem] leading-relaxed text-[#5F5A52] font-medium">
                {event.about[0]}
              </p>
            </div>

            <dl className="mt-12 grid grid-cols-1 gap-px border-t border-[#EAE3D8] pt-6 sm:grid-cols-3 sm:gap-8">
              <div className="py-2 sm:py-0">
                <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Date</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-snug text-[#2E4739] font-semibold">{event.dateLabel}</dd>
              </div>
              <div className="py-2 sm:py-0">
                <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Time</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-snug text-[#2E4739] font-semibold">{event.timeLabel}</dd>
              </div>
              <div className="py-2 sm:py-0">
                <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Where</dt>
                <dd className="mt-1.5 text-[0.95rem] leading-snug text-[#2E4739] font-semibold">{event.venue}</dd>
              </div>
            </dl>
          </div>

          <figure className="relative overflow-hidden rounded-[1.75rem] shadow-soft">
            <img
              src={event.heroImage}
              alt={event.title}
              className={`h-[24rem] w-full object-cover sm:h-[32rem] lg:h-full ${
                !isUpcoming ? "opacity-90 saturate-[0.85]" : ""
              }`}
            />
            <span
              className={`absolute inset-0 ${!isUpcoming ? "bg-[#2E4739]/35" : "bg-[#2E4739]/5"}`}
              aria-hidden="true"
            />
            {!isUpcoming && (
              <figcaption className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-[#2E4739] font-bold shadow-sm">
                Completed Gathering
              </figcaption>
            )}
          </figure>
        </section>

        {/* Content Section */}
        <section className="mt-16 grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <div>
            {/* Description Section */}
            <section aria-labelledby="about-heading" className="grid gap-6 lg:grid-cols-[0.3fr_1fr] lg:gap-12">
              <h2
                id="about-heading"
                className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] lg:pt-2 font-bold"
              >
                {isUpcoming ? "The invitation" : "That evening"}
              </h2>
              <div className="max-w-[60ch] space-y-5 text-[1.05rem] leading-relaxed text-[#5F5A52] font-medium">
                {event.about.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Journey Section */}
            {event.journeyPoints && event.journeyPoints.length > 0 && (
              <section
                aria-labelledby="journey-heading"
                className="mt-20 grid gap-6 lg:grid-cols-[0.3fr_1fr] lg:gap-12"
              >
                <h2
                  id="journey-heading"
                  className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] lg:pt-2 font-bold"
                >
                  {isUpcoming ? "What to expect" : "How it was held"}
                </h2>
                <ol className="max-w-[60ch] w-full">
                  {event.journeyPoints.map((point, index) => {
                    const parts = point.split(/[-:]/);
                    let stepNumber = `Step ${index + 1}`;
                    let title = point;
                    if (parts.length > 1 && parts[0].trim().length < 25) {
                      stepNumber = parts[0].trim();
                      title = parts.slice(1).join("-").trim();
                    }
                    return (
                      <li
                        key={index}
                        className="grid gap-1 border-t border-[#EAE3D8] py-6 sm:grid-cols-[5.5rem_1fr] sm:gap-6 w-full"
                      >
                        <p className="pt-0.5 text-[0.8rem] uppercase tracking-[0.12em] text-[#8C867C] font-bold">
                          {stepNumber}
                        </p>
                        <div>
                          <p className="font-display text-[1.3rem] leading-snug text-[#2E4739] font-bold">{title}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Audience Section */}
            {event.audienceText && (
              <section
                aria-labelledby="audience-heading"
                className="mt-20 rounded-[1.5rem] bg-[#E3ECE5]/30 border border-[#EAE3D8] px-7 py-9 sm:px-10 sm:py-11"
              >
                <h2 id="audience-heading" className="font-display text-[1.6rem] leading-tight text-[#2E4739] font-bold">
                  Who it&rsquo;s for
                </h2>
                <div className="mt-5 text-[1.05rem] leading-relaxed text-[#5F5A52] font-medium">
                  {event.audienceText}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <aside aria-label={isUpcoming ? "Booking" : "Gathering details"}>
            {isUpcoming ? (
              <div className="lg:sticky lg:top-10">
                <div className="rounded-[1.5rem] bg-[#E3ECE5]/40 border border-[#EAE3D8] px-7 py-8 shadow-sm">
                  <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8C867C] font-bold">Contribution</p>
                  <p className="mt-2.5 font-display text-[2.35rem] leading-none text-[#2E4739] font-bold">{event.price}</p>
                  <p className="mt-2 text-sm text-[#5F5A52] font-semibold">per person, for the full evening</p>

                  <div className="mt-8">
                    <p className="text-sm text-[#2E4739] font-bold">
                      {event.seatsLeft}
                    </p>
                  </div>

                  <Link
                    href={`/?next=/dashboard/events/${event.id}`}
                    className="mt-8 block w-full rounded-full bg-[#2E4739] hover:bg-[#1F3227] px-6 py-3.5 text-center text-sm font-bold tracking-wide text-white transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4739]"
                  >
                    Reserve Your Spot
                  </Link>
                </div>

                <ul className="mt-7 space-y-3.5 text-xs leading-relaxed text-[#8C867C] font-semibold">
                  <li className="border-t border-[#EAE3D8] pt-3.5">Everything shared in the circle stays in the circle.</li>
                  <li className="border-t border-[#EAE3D8] pt-3.5">You may pass, stay quiet, or step out at any point.</li>
                  <li className="border-t border-[#EAE3D8] pt-3.5">Small gatherings only, so there is room for each voice.</li>
                </ul>
              </div>
            ) : (
              <div className="lg:sticky lg:top-10 rounded-[1.5rem] bg-[#EAE3D8]/30 border border-[#EAE3D8] p-6 shadow-sm">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#8C867C] font-bold">This gathering</p>
                <p className="mt-4 font-display text-[1.3rem] leading-snug text-[#2E4739] font-bold">
                  Closed on {event.dateLabel}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#5F5A52] font-semibold">
                  This session has successfully concluded.
                </p>
                <a
                  href="#recap-heading"
                  className="mt-5 inline-flex items-center gap-2 border-b border-[#2E4739]/40 pb-0.5 text-sm text-[#2E4739] font-bold transition hover:border-[#2E4739] hover:text-[#1F3227]"
                >
                  Read the recap
                </a>
              </div>
            )}
          </aside>
        </section>
      </div>

      {/* Facilitator Panel */}
      <section aria-labelledby="facilitator-heading" className="border-y border-[#EAE3D8] bg-[#FBF8F3]/60 relative z-10">
        <div className="mx-auto grid max-w-[78rem] gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1fr] lg:gap-16 lg:px-10 lg:py-20">
          <figure className="overflow-hidden rounded-[1.5rem] shadow-soft max-h-[360px] lg:max-h-none">
            <img
              src={event.facilitatorImage}
              alt={event.facilitatorName}
              className="h-full w-full object-cover"
            />
          </figure>

          <div className="flex flex-col justify-center">
            <p id="facilitator-heading" className="text-[0.7rem] uppercase tracking-[0.18em] text-[#8C867C] font-bold">
              Held by
            </p>
            <p className="mt-4 font-display text-[2rem] leading-tight text-[#2E4739] font-bold">
              {event.facilitatorName}
            </p>
            <p className="mt-1.5 text-sm text-[#8C867C] font-semibold">{event.facilitatorRole}</p>

            <p className="mt-7 max-w-[48ch] text-[1.1rem] leading-relaxed text-[#5F5A52] font-medium">
              {event.facilitatorBio}
            </p>

            {event.testimonialQuote && (
              <blockquote className="mt-7 rounded-xl bg-[#E3ECE5]/30 border border-[#EAE3D8] p-5">
                <p className="text-sm italic leading-relaxed text-[#5F5A52] font-semibold">
                  &ldquo;{event.testimonialQuote}&rdquo;
                </p>
                {event.testimonialAuthor && (
                  <footer className="mt-3 text-xs font-bold text-[#6E9179]">
                    — {event.testimonialAuthor}
                  </footer>
                )}
              </blockquote>
            )}
          </div>
        </div>
      </section>

      {/* Completed Recap Media Highlights */}
      {!isUpcoming && (
        <section aria-labelledby="recap-heading" className="border-b border-[#EAE3D8] relative z-10">
          <div className="mx-auto max-w-[78rem] px-6 py-16 lg:px-10 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.34fr_1fr] lg:gap-16">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">Recap</p>
                <h2 id="recap-heading" className="mt-4 font-display text-[2rem] leading-tight text-[#2E4739] font-bold">
                  How the evening unfolded
                </h2>
              </div>
              <div className="max-w-[60ch] space-y-5 text-[1.05rem] leading-relaxed text-[#5F5A52] font-medium">
                {event.about.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Gallery Images */}
            {event.completedImages && event.completedImages.length > 0 && (
              <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                {event.completedImages.map((photo, index) => (
                  <figure key={photo} className={index % 2 === 1 ? "sm:mt-14" : ""}>
                    <div className="overflow-hidden rounded-[1.25rem] bg-[#E3ECE5]/20 border border-[#EAE3D8] shadow-soft">
                      <img
                        src={photo}
                        alt={`Gathering Capture ${index + 1}`}
                        className={`w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.015] ${
                          index % 2 === 1 ? "h-64 sm:h-80" : "h-72 sm:h-[26rem]"
                        }`}
                      />
                    </div>
                    <figcaption className="mt-3 text-xs leading-relaxed text-[#8C867C] font-semibold">
                      Moment captured during the gathering
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {/* Video Highlights */}
            {event.completedVideos && event.completedVideos.length > 0 && (
              <div className="mt-20">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#6E9179] font-bold">Video highlights</p>
                <div className="grid gap-6 mt-6 sm:grid-cols-2">
                  {event.completedVideos.map((videoUrl, index) => (
                    <div key={videoUrl} className="rounded-[1.25rem] overflow-hidden border border-[#EAE3D8] bg-black p-3 shadow-soft">
                      <video src={videoUrl} controls className="w-full rounded-xl max-h-[360px] bg-black" />
                      <p className="mt-2 text-center text-xs font-bold text-[#6E9179]">
                        Highlight Reel #{index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer Section */}
      <section className="mx-auto max-w-[78rem] px-6 py-20 text-center lg:px-10 relative z-10">
        <p className="mx-auto max-w-[30ch] font-display text-[1.75rem] leading-snug text-[#2E4739] font-bold sm:text-[2rem]">
          {isUpcoming
            ? "If this one is not the right evening, another circle is always coming."
            : "Circles like this one happen every few weeks. There is room for you at the next."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#6E9179] hover:text-[#2E4739] transition-colors duration-200"
        >
          Explore upcoming gatherings
          <ArrowRightIcon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
