import { FadeIn } from "@/components/ui/fade-in";

const profileTags = ["Mindfulness", "Inner Calm", "Restore"] as const;

const statCards = [
  { value: "24", label: "Sessions" },
  { value: "12", label: "Streak" },
  { value: "15h", label: "Zen Time" },
  { value: "98%", label: "Focus" },
] as const;

const identityItems = [
  { label: "Email Address", value: "elena.vance@atrium.me" },
  { label: "Primary Focus", value: "Mindfulness Therapy" },
  { label: "Timezone", value: "Pacific Standard Time (UTC-8)" },
  { label: "Member Since", value: "January 2024" },
] as const;

const recentPractices = [
  { title: "Deep Breath Meditation", meta: "Yesterday at 6:30 PM • 15 mins", icon: "breath" as const },
  { title: "Ocean Soundscape", meta: "Feb 12 • 45 mins", icon: "waves" as const },
] as const;

function PracticeIcon({ icon }: { icon: "breath" | "waves" }) {
  if (icon === "breath") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 5v4M8.5 8.5 12 12l3.5-3.5M6 18a6 6 0 1 1 12 0" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
    </svg>
  );
}

export default function ProfilePage() {
  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-9 md:pb-12">
      <section className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <article className="space-y-3">
          <div className="group relative w-fit rounded-calm bg-white p-1.5 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-soft-hover">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=640&q=80&auto=format&fit=crop"
              alt="Elena Vance"
              className="h-40 w-32 rounded-gentle object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03]"
            />
            <span className="absolute -bottom-2 right-2 rounded-full bg-text-secondary px-2.5 py-1 text-[10px] font-semibold text-white">
              LVL 4
            </span>
          </div>
          <div>
            <h1 className="font-display text-6xl font-semibold leading-[0.88] text-text-primary">Elena Vance</h1>
            <p className="mt-2 text-2xl text-text-primary/80">Pathfinder Level 4</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileTags.map((tag, idx) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  idx === 0
                    ? "bg-primary/30 text-text-secondary"
                    : idx === 1
                      ? "bg-primary/15 text-text-secondary"
                      : "bg-[#e9dfd3] text-text-primary/75"
                } transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-sm`}
              >
                {tag}
              </span>
            ))}
          </div>
        </article>

        <div className="space-y-5">
          <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-4xl font-semibold text-text-primary">About Me</h2>
              <button
                type="button"
                className="rounded-full p-2 text-text-secondary/80 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-accent/45"
                aria-label="Edit about"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 20h4l10-10a2 2 0 1 0-4-4L4 16v4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="mt-4 max-w-3xl text-[1.02rem] leading-relaxed text-text-primary/72">
              Exploring the intersections of mindfulness and modern living. I started this journey to find a quiet space
              in a loud world, and now I&apos;m helping others cultivate their own inner atrium.
            </p>
          </article>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <article
                key={stat.label}
                className="rounded-gentle bg-white px-5 py-4 text-center shadow-soft transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover"
              >
                <p className="font-display text-4xl font-semibold text-text-secondary">{stat.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <article className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
          <h2 className="flex items-center gap-2 font-display text-3xl font-semibold text-text-primary">
            <span className="inline-flex rounded-full bg-primary/15 p-1 text-text-secondary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
              </svg>
            </span>
            Identity Details
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {identityItems.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">{item.label}</p>
                <p className="mt-1 text-xl font-medium text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-calm bg-primary/10 p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
          <h3 className="font-display text-3xl font-semibold text-text-secondary">Next Milestone</h3>
          <p className="mt-2 text-sm text-text-primary/70">3 sessions away from Pathfinder LVL 5</p>

          <div className="mt-6 flex justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-6 border-primary/20">
              <div className="absolute inset-0 rounded-full border-6 border-transparent border-t-text-secondary border-r-text-secondary rotate-45" />
              <span className="font-display text-4xl font-semibold text-text-secondary">70%</span>
            </div>
          </div>

          <button
            type="button"
            className="mt-7 w-full rounded-full bg-text-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover"
          >
            Continue Journey →
          </button>
        </article>
      </section>

      <section className="rounded-calm bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:shadow-soft-hover md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold text-text-primary">Recent Practices</h2>
          <button
            type="button"
            className="text-sm font-semibold text-text-secondary/80 transition-[transform,color] duration-300 hover:-translate-y-0.5 hover:text-text-secondary"
          >
            View History
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {recentPractices.map((item) => (
            <article
              key={item.title}
              className="flex items-center justify-between gap-4 rounded-gentle bg-background px-4 py-3 transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:bg-accent/35 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-gentle bg-primary/20 p-2 text-text-secondary">
                  <PracticeIcon icon={item.icon} />
                </span>
                <div>
                  <p className="text-lg font-semibold text-text-primary">{item.title}</p>
                  <p className="text-sm text-text-primary/58">{item.meta}</p>
                </div>
              </div>
              <span className="text-text-primary/35" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </article>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
