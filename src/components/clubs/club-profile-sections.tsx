import type { ApiClubDetail } from "@/types/api";

const PULSE_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506126613645-ec7d4b49df55?w=900&q=80&auto=format&fit=crop";

function WindIcon() {
  return (
    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 4C6.5 4 4 6.5 4 9.5M14.5 20C17.5 20 20 17.5 20 14.5M4 14.5H14.5M9.5 4H20M4 9.5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3C8 8 6 12 6 16a6 6 0 0 0 12 0c0-4-2-8-6-13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ClubProfileSectionsProps = {
  club: ApiClubDetail;
};

export function ClubProfileSections({ club }: ClubProfileSectionsProps) {
  const gallery = club.galleryUrls.filter(Boolean);
  const pulseImage = gallery[0] ?? club.heroImageUrl ?? PULSE_FALLBACK_IMAGE;
  const features = club.landingFeatures.slice(0, 2);
  const rituals = club.landingRituals.slice(0, 4);

  const pulseBody =
    club.description?.trim() ||
    club.purpose?.trim() ||
    null;

  const showPulse =
    pulseBody != null ||
    features.length > 0 ||
    club.pulseQuote?.trim() ||
    gallery.length > 0;

  const showRituals =
    rituals.length > 0 || club.ritualsIntro?.trim();

  const showVoices =
    club.reviews.length > 0 || club.voicesQuote?.trim();

  return (
    <>
      {showPulse ? (
        <section className="rounded-calm bg-white p-6 shadow-soft md:p-8">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">
            The pulse of the collective
          </h2>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-2">
            <div>
              {pulseBody ? (
                <p className="text-base leading-relaxed text-text-primary/70">{pulseBody}</p>
              ) : null}
              {features.length > 0 ? (
                <div className={`grid gap-4 sm:grid-cols-2 ${pulseBody ? "mt-6" : ""}`}>
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-gentle border border-accent/50 bg-accent/20 p-4"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white">
                        {feature.icon === "leaf" ? <LeafIcon /> : <WindIcon />}
                      </div>
                      <p className="font-semibold text-text-primary">{feature.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-text-primary/65">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pulseImage}
                alt=""
                className="aspect-[4/5] w-full rounded-calm object-cover"
              />
              {club.pulseQuote?.trim() ? (
                <div className="absolute -bottom-3 left-3 max-w-[85%] rounded-gentle bg-white p-4 shadow-soft md:left-4">
                  <p className="text-sm italic leading-relaxed text-primary">
                    &ldquo;{club.pulseQuote.trim()}&rdquo;
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showRituals ? (
        <section className="rounded-calm bg-white p-6 shadow-soft md:p-8">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">Our rituals</h2>
          {club.ritualsIntro?.trim() ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-primary/70">
              {club.ritualsIntro.trim()}
            </p>
          ) : null}
          <div className="mt-8 space-y-10">
            {rituals.map((ritual, index) => {
              const image =
                ritual.imageUrl?.trim() ||
                gallery[index + 1] ||
                gallery[0] ||
                PULSE_FALLBACK_IMAGE;
              const imageFirst = index % 2 === 0;
              return (
                <article
                  key={`${ritual.label}-${ritual.title}`}
                  className={`grid items-center gap-6 lg:grid-cols-2 ${
                    imageFirst ? "" : "lg:[&>*:first-child]:order-2"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className={`h-56 w-full rounded-calm object-cover md:h-72 ${
                      imageFirst ? "" : "lg:order-2"
                    }`}
                  />
                  <div className={imageFirst ? "" : "lg:order-1"}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {ritual.label}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary md:text-2xl">
                      {ritual.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-primary/70 md:text-base">
                      {ritual.description}
                    </p>
                    {ritual.cta?.trim() ? (
                      <p className="mt-4 text-sm font-semibold text-primary">{ritual.cta.trim()}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {showVoices ? (
        <section className="rounded-calm bg-text-secondary p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <h2 className="font-display text-2xl font-semibold">Voices from the circle</h2>
            {club.voicesQuote?.trim() ? (
              <p className="max-w-md text-sm italic leading-relaxed text-white/75 md:text-right">
                &ldquo;{club.voicesQuote.trim()}&rdquo;
              </p>
            ) : null}
          </div>
          {club.reviews.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {club.reviews.map((review) => (
                <blockquote
                  key={review.id}
                  className="rounded-gentle border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-base italic leading-relaxed text-white/90">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                  <footer className="mt-4 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white">{review.authorLabel}</p>
                    {review.memberSince?.trim() ? (
                      <p className="mt-1 text-sm text-white/50">
                        Member since {review.memberSince.trim()}
                      </p>
                    ) : null}
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {club.finalCtaText?.trim() ? (
        <section className="rounded-calm border border-accent/70 bg-accent/15 p-6 text-center md:p-8">
          <h2 className="font-display text-2xl font-semibold text-text-secondary">
            Your sanctuary awaits
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-text-primary/70">
            {club.finalCtaText.trim()}
          </p>
        </section>
      ) : null}
    </>
  );
}
