import { FadeIn } from "@/components/ui/fade-in";
import { wellnessPackages } from "@/data/packages";
import Link from "next/link";

export default function PackagesPage() {
  return (
    <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12">
      <section className="space-y-4 md:space-y-5">
        <h1 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">Wellness Packages</h1>
        <p className="max-w-3xl text-base leading-relaxed text-text-primary/70 md:text-lg">
          Curated therapeutic journeys designed to foster long-term growth and emotional stability. Select a bundle
          that resonates with your current path.
        </p>
      </section>

      <section className="grid gap-6 md:gap-7 lg:grid-cols-3">
        {wellnessPackages.map((entry) => (
          <article
            key={entry.id}
            className="group overflow-hidden rounded-calm border border-accent/70 bg-white shadow-soft transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft-hover"
          >
            <div className="relative">
              <img
                src={entry.image}
                alt={entry.title}
                className="h-44 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04] md:h-48"
              />
              {entry.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  {entry.badge}
                </span>
              ) : null}
            </div>

            <div className="space-y-4 p-5 md:space-y-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">{entry.sessions}</p>
              <h2 className="font-display text-[2rem] font-semibold leading-tight text-text-primary">{entry.title}</h2>
              <p className="text-sm leading-relaxed text-text-primary/68">{entry.description}</p>

              <div className="flex items-end justify-between gap-3 pt-3">
                <div>
                  {entry.originalPrice ? (
                    <p className="text-xs font-semibold text-text-primary/40 line-through">{entry.originalPrice}</p>
                  ) : null}
                  <p className="font-display text-4xl font-semibold text-text-primary">{entry.currentPrice}</p>
                </div>

                <Link
                  href={`/dashboard/packages/${entry.id}`}
                  className="rounded-full bg-[#e8ded2] px-5 py-2.5 text-sm font-semibold text-text-primary transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#dfd3c5]"
                >
                  {entry.ctaLabel}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-calm bg-primary/10 p-6 transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft md:p-8 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-8">
          <div>
            <h3 className="font-display text-3xl font-semibold text-text-secondary md:text-4xl">Need a custom plan?</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-primary/70 md:text-base">
              Our practitioners can help design a bespoke package tailored to your unique clinical needs.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-text-secondary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover"
          >
            Consult with us
          </button>
        </div>
      </section>
    </FadeIn>
  );
}
