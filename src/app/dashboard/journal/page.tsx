import { JournalEditor } from "@/components/dashboard/journal-editor";
import { FadeIn } from "@/components/ui/fade-in";

const reflections = [
  { date: "Oct 24, 2023", title: "Morning Clarity", tag: "Peaceful", tagClass: "bg-primary/20 text-text-secondary" },
  { date: "Oct 21, 2023", title: "Work Pressure", tag: "Anxious", tagClass: "bg-[#ffd6d6] text-[#9a2d2d]" },
  { date: "Oct 19, 2023", title: "Gratitude Walk", tag: "Grateful", tagClass: "bg-[#e8e5de] text-text-primary/70" },
];

export default function JournalPage() {
  return (
    <FadeIn className="space-y-10 md:space-y-12">
      <header className="space-y-4 md:space-y-5">
        <h1 className="font-display text-6xl font-semibold text-text-primary">
          How are you feeling, Sarah?
        </h1>
        <p className="max-w-xl text-lg text-text-primary/70">
          Take a moment to breathe. This space is yours, without judgment or distraction.
        </p>
      </header>

      <section className="grid gap-8 xl:grid-cols-[220px_1fr] xl:gap-10">
        <aside className="space-y-6 pt-2 xl:pr-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">Past Reflections</p>

          <div className="space-y-7">
            {reflections.map((entry, index) => (
              <article
                key={entry.title}
                className="group relative -ml-2 cursor-pointer rounded-gentle py-2 pl-6 pr-3 transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent/35"
              >
                <span
                  className={`absolute left-0 top-3.5 h-2.5 w-2.5 rounded-full border transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-125 ${
                    index === 0 ? "border-primary bg-primary/25 shadow-[0_0_0_4px_rgb(127_175_154/18%)]" : "border-accent/90 bg-white"
                  }`}
                />
                {index < reflections.length - 1 ? (
                  <span className="absolute left-[4px] top-10 h-14 w-px bg-accent/75 transition-colors group-hover:bg-primary/25" aria-hidden />
                ) : null}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45">{entry.date}</p>
                <p className="mt-1 text-base font-semibold text-text-primary transition-colors group-hover:text-text-secondary">
                  {entry.title}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-px group-hover:shadow-sm ${entry.tagClass}`}
                >
                  {entry.tag}
                </span>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="pt-2 text-sm font-semibold uppercase tracking-wide text-text-secondary transition-[letter-spacing,color,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:tracking-[0.08em] hover:text-text-primary"
          >
            View Archive &gt;
          </button>
        </aside>

        <JournalEditor />
      </section>
    </FadeIn>
  );
}
