import { FadeIn } from "@/components/ui/fade-in";
import { wellnessPackageDetails } from "@/data/packages";
import { notFound } from "next/navigation";

const reviewCards = [
  {
    quote:
      "The guided meditations are unlike anything I've tried. The sound quality and voice really helped me ground myself.",
    by: "Sarah L.",
  },
  {
    quote:
      "Perfect for beginners. The structure was clear and not overwhelming, and journaling made the biggest difference.",
    by: "Michael K.",
  },
  {
    quote:
      "Worth every penny. The private sessions felt truly personal and practical for my weekly routine.",
    by: "Jessica W.",
  },
];

function IncludedIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 4v6M8 8h8M7 20a5 5 0 1 1 10 0" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M5 12a7 7 0 0 1 14 0v5H5v-5Z" />
        <path d="M9 17v2M15 17v2" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 7h12M4 12h10M4 17h8" strokeLinecap="round" />
        <path d="m16 16 4 4M20 16l-4 4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m12 4 1.8 3.6L18 9.5l-3 2.9.7 4.1L12 14.6 8.3 16.5l.7-4.1-3-2.9 4.2-.9L12 4Z" />
    </svg>
  );
}

export default async function PackageDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = wellnessPackageDetails.find((entry) => entry.id === id);

  if (!detail) {
    notFound();
  }

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12">
      <section className="rounded-calm bg-white p-6 shadow-soft md:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center lg:gap-10">
          <div>
            <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Most Popular
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.92] text-text-primary sm:text-6xl md:text-7xl">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-text-primary/70">{detail.subtitle}</p>

            <div className="mt-8 border-t border-accent/60 pt-6">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">Duration</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">{detail.duration}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">Intensity</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">Beginner Friendly</p>
                </div>
              </div>
              <p className="mt-6 text-sm font-semibold text-text-primary/80">
                ☆ 4.9 <span className="ml-1 text-text-primary/45">(128 Reviews)</span>
              </p>
            </div>
          </div>

          <div className="relative">
            <img
              src={detail.heroImage}
              alt={detail.title}
              className="h-[340px] w-full rounded-calm object-cover shadow-soft transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02]"
            />
            <div className="absolute -bottom-4 left-4 rounded-gentle bg-white px-4 py-3 shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary/80">Curated By</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Dr. Elena Vance</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:gap-7 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6 lg:space-y-7">
          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">What&apos;s Included</h2>
            <div className="mt-5 grid gap-4 md:gap-5 sm:grid-cols-2">
              {detail.includes.slice(0, 4).map((item, index) => (
                <div
                  key={item}
                  className="rounded-gentle bg-background p-4 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span className="inline-flex text-text-secondary transition-transform duration-300">
                    <IncludedIcon index={index} />
                  </span>
                  <p className="mt-3 text-lg font-semibold text-text-primary">{item}</p>
                  <p className="mt-2 text-sm text-text-primary/65">
                    Guided support designed to help you build durable, practical wellness habits.
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h2 className="font-display text-4xl font-semibold text-text-primary">How it works</h2>
            <div className="mt-5 space-y-5">
              {["Foundation Week", "The Conscious Mind", "Resilience Building"].map((step) => (
                <div key={step} className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 rounded-full bg-primary/55" aria-hidden />
                  <div>
                    <p className="text-xl font-semibold text-text-primary">{step}</p>
                    <p className="text-sm text-text-primary/65">
                      Structured sessions with clear weekly focus, practical exercises, and measurable progress.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-4xl font-semibold text-text-primary">Member Reflections</h2>
              <button type="button" className="text-sm font-semibold text-text-secondary">
                Read all 128 reviews →
              </button>
            </div>
            <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
              {reviewCards.map((review) => (
                <div
                  key={review.by}
                  className="rounded-gentle bg-background p-4 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="text-sm tracking-widest text-text-secondary">☆☆☆☆☆</p>
                  <p className="mt-2 text-sm italic leading-relaxed text-text-primary/74">&quot;{review.quote}&quot;</p>
                  <p className="mt-4 text-sm font-semibold text-text-primary">{review.by}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-5 lg:space-y-6">
          <aside className="rounded-calm bg-text-secondary p-6 text-white shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <h3 className="font-display text-4xl font-semibold">Ready to start?</h3>
            <p className="mt-2 text-sm text-white/85">
              Join 1,200+ individuals who have transformed their daily routines with this bundle.
            </p>

            <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Bundle Price</span>
                <span className="font-semibold">{detail.originalPrice ?? detail.currentPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Wallet Balance</span>
                <span className="font-semibold text-primary/80">$1,240.00</span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/20 pt-4">
              <p className="text-sm text-white/85">Total Remaining</p>
              <p className="font-display text-5xl font-semibold text-primary/90">$790.00</p>
            </div>

            <button
              type="button"
              className="mt-6 w-full rounded-full bg-[#2f7b64] px-6 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#286b57]"
            >
              Purchase Bundle →
            </button>
          </aside>

          <article className="rounded-calm bg-white p-5 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary/70">Guaranteed</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">100% Satisfaction</p>
            <p className="mt-3 text-sm text-text-primary/68">
              If you don&apos;t feel a shift in your awareness after the first week, we&apos;ll provide a full refund.
            </p>
          </article>
        </div>
      </section>
    </FadeIn>
  );
}
