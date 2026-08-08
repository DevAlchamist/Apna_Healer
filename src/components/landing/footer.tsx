"use client";

import React, { useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  HeartHandshakeIcon,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";

const columns = [
  {
    title: "Support",
    links: ["Talk to a listener", "Find a therapist", "Community circles", "Crisis resources", "Self-help library"],
  },
  {
    title: "Company",
    links: ["About Apna Healer", "Our care standards", "Become a listener", "For professionals", "Careers"],
  },
  {
    title: "Trust & safety",
    links: ["Privacy promise", "How we verify experts", "Terms of use", "Data & consent", "Report a concern"],
  },
];

const socials = [
  { label: "Instagram", icon: Instagram },
  { label: "Twitter", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "YouTube", icon: Youtube },
];

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setDone(true);
  };

  return (
    <footer className="border-t border-cream-300 bg-cream-100/70">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5" aria-label="Apna Healer home">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl">
                <img
                  src="/logo.svg"
                  alt=""
                  width={84}
                  height={80}
                  className="h-full w-full object-cover  object-center"
                  draggable={false}
                />              </span>
              <span className="font-display text-lg text-ink-900 font-semibold">
                Apna<span className="text-sage-600">Healer</span>
              </span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-500">
              A gentle, judgment-free space for Indian minds. Peer listeners, verified therapists and small communities — whenever you
              need them.
            </p>

            <form onSubmit={submit} className="mt-7 max-w-sm">
              <label htmlFor="newsletter" className="text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                A calm letter, twice a month
              </label>
              {done ? (
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-sage-100 px-4 py-3 text-sm text-sage-700 font-semibold">
                  <CheckIcon className="h-4 w-4" />
                  You’re on the list. Nothing but warmth, we promise.
                </p>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 p-1.5 transition focus-within:border-sage-300">
                  <input
                    id="newsletter"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent px-4 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to the newsletter"
                    className="shrink-0 rounded-full bg-sage-600 p-2.5 text-cream-50 transition hover:bg-sage-700"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </form>

            <div className="mt-7 flex gap-2">
              {socials.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#top"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-500 transition hover:border-sage-200 hover:text-sage-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-ink-400">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#top" className="text-sm text-ink-700 transition hover:text-sage-600 font-semibold">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 rounded-3xl bg-peach-50 px-6 py-5 text-xs leading-relaxed text-ink-500">
          <strong className="font-semibold text-ink-700">If you’re in crisis:</strong> Apna Healer is not an emergency service. Please call
          Tele-MANAS at 14416 (India, 24/7) or your local emergency number if you or someone you love is in immediate danger.
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-cream-300 pt-8 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Apna Healer. Made with care in Mumbai.</p>
          <div className="flex flex-wrap gap-5">
            <a href="#top" className="transition hover:text-ink-700">
              Privacy
            </a>
            <a href="#top" className="transition hover:text-ink-700">
              Terms
            </a>
            <a href="#top" className="transition hover:text-ink-700">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
