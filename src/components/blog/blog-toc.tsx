"use client";

import type { BlogTocEntry } from "@/lib/blog-blocks";

type BlogTocProps = {
  entries: BlogTocEntry[];
};

export function BlogToc({ entries }: BlogTocProps) {
  if (entries.length === 0) return null;

  return (
    <nav className="rounded-calm border border-[#ebe5de] bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">
        On this page
      </p>
      <ul className="mt-4 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: `${(entry.level - 1) * 12}px` }}>
            <a
              href={`#heading-${entry.id}`}
              className="text-sm text-text-primary/70 transition-colors hover:text-text-secondary"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
