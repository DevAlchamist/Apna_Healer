import { safeCirclePosts } from "@/data/safe-circle-posts";
import { FadeIn } from "@/components/ui/fade-in";
import Link from "next/link";
import { notFound } from "next/navigation";

type SafeCircleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const reflections = [
  {
    author: "Marcus Chen",
    time: "2h ago",
    text: "This resonated so much. I've been doing the 'phone-free' morning for a month now. It changed my anxiety levels completely. The first 15 minutes are sacred.",
  },
  {
    author: "Liam Wilson",
    time: "5h ago",
    text: "I tried this today after reading your post. It was hard to not reach for the phone, but the sound of the birds was actually quite meditative. Thank you for the push.",
  },
];

export default async function SafeCircleDetailPage({ params }: SafeCircleDetailPageProps) {
  const { slug } = await params;
  const post = safeCirclePosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <FadeIn className="grid gap-6 pb-10 md:gap-7 md:pb-12 xl:grid-cols-[minmax(0,1fr)_300px]">
      <article className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover md:p-8">
        <Link href="/dashboard/safe-circle" className="text-sm font-medium text-text-primary/60 hover:text-text-secondary">
          ← Back to Safe Circle
        </Link>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-text-primary md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-sm font-medium text-text-primary/75">
          {post.author} · Posted {post.time} · {post.circle}
        </p>

        <p className="mt-6 text-base leading-relaxed text-text-primary/75">{post.body}</p>
        {post.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title} className="mt-6 h-auto w-full rounded-gentle object-cover" />
          </>
        ) : null}
        <p className="mt-5 text-base leading-relaxed text-text-primary/75">
          Last week, I tried something different. I left the phone in the other room. I sat by the window for just ten
          minutes. No music, no podcast. Just the sound of the world waking up. It felt uncomfortable at first, then
          strangely grounding.
        </p>
        <p className="mt-5 text-base leading-relaxed text-text-primary/75">
          I realized that the atrium is not just a place we visit; it is a state of mind we have to build every morning.
          How are you all finding your moments of stillness today?
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-accent/80 pt-5">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-full bg-text-secondary px-5 py-2 text-sm font-semibold text-white">
              Support
            </button>
            <button type="button" className="rounded-full bg-[#e9dfd1] px-5 py-2 text-sm font-semibold text-text-primary/80">
              Relate
            </button>
          </div>
          <button type="button" className="text-sm font-medium text-text-primary/55">
            Share
          </button>
        </div>

        <section className="mt-10 space-y-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Reflections (24)</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-primary/45">Most Recent</p>
          </div>

          <div className="rounded-gentle border border-accent/75 bg-background px-4 py-3">
            <input
              type="text"
              placeholder="Share your reflection..."
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/45"
            />
          </div>

          <div className="space-y-5">
            {reflections.map((reflection) => (
              <div key={reflection.author} className="border-b border-accent/65 pb-4 last:border-b-0">
                <p className="text-sm font-semibold text-text-primary">
                  {reflection.author} <span className="text-xs font-medium text-text-primary/45">{reflection.time}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary/70">{reflection.text}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <aside className="space-y-5">
        <section className="rounded-calm border border-accent/80 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-primary/45">Current Circle</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-text-secondary">Quiet Waters</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-primary/65">
            A dedicated space for those seeking to reduce morning anxiety and build mindful daily rituals.
          </p>
          <button type="button" className="mt-5 w-full rounded-full border border-accent/80 px-4 py-2 text-sm font-semibold text-text-primary/75">
            Circle Resources
          </button>
        </section>

        <section className="rounded-calm border border-accent/80 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover md:p-6">
          <h4 className="text-sm font-semibold text-text-primary">Continuing the thought</h4>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-gentle bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-primary/45">Journaling</p>
              <p className="mt-1 font-semibold text-text-primary/80">5 prompts for when the silence feels too loud</p>
            </div>
            <div className="rounded-gentle bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-primary/45">Rituals</p>
              <p className="mt-1 font-semibold text-text-primary/80">The art of the three-minute tea ceremony</p>
            </div>
            <div className="rounded-gentle bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-primary/45">Science</p>
              <p className="mt-1 font-semibold text-text-primary/80">Why blue light triggers morning cortisol spikes</p>
            </div>
          </div>
        </section>
      </aside>
    </FadeIn>
  );
}
