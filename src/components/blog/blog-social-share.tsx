"use client";

type BlogSocialShareProps = {
  url: string;
  title: string;
  variant?: "default" | "pill";
};

export function BlogSocialShare({ url, title, variant = "default" }: BlogSocialShareProps) {
  async function shareJourney() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => void shareJourney()}
        className="inline-flex items-center gap-2 rounded-full bg-[#ece9e2] px-5 py-2.5 text-sm font-semibold text-[#3e4b4a] transition-colors hover:bg-[#e2ddd3]"
      >
        <ShareIcon />
        Share Journey
      </button>
    );
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
        Share
      </span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#ece9e2] px-3 py-1.5 text-xs font-semibold text-text-primary/70 hover:bg-primary/20"
      >
        Twitter
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#ece9e2] px-3 py-1.5 text-xs font-semibold text-text-primary/70 hover:bg-primary/20"
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={() => void shareJourney()}
        className="rounded-full bg-[#ece9e2] px-3 py-1.5 text-xs font-semibold text-text-primary/70 hover:bg-primary/20"
      >
        Copy link
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}
