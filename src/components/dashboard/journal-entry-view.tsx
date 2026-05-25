"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  categoryLabelForEntry,
  formatJournalHeaderDate,
  moodLabel,
  parseJournalHtml,
} from "@/lib/journal-content";
import { easeCalm, hoverLiftTransition } from "@/components/ui/fade-in";
import type { ApiJournalEntry } from "@/types/api";

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeCalm } },
};

const REACTIONS = ["✨", "🌱", "🌊", "🟠"] as const;

type JournalEntryViewProps = {
  entry: ApiJournalEntry;
};

export function JournalEntryView({ entry }: JournalEntryViewProps) {
  const [cherished, setCherished] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("exhale");

  const parsed = useMemo(
    () => parseJournalHtml(entry.contentHtml, entry.coverImageUrl, entry.tags),
    [entry.contentHtml, entry.coverImageUrl, entry.tags],
  );

  const category = categoryLabelForEntry(entry.tags, entry.cardVariant);
  const headerDate = formatJournalHeaderDate(entry.journalDateKey, entry.completedAt);
  const mood = moodLabel(entry.mood);
  const isDark = entry.cardVariant === "DARK";

  const quoteRef = useRef<HTMLDivElement | null>(null);
  const quoteInView = useInView(quoteRef, { once: true, margin: "-80px" });

  useEffect(() => {
    const id = window.setInterval(() => {
      setBreathPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const firstParagraph = parsed.paragraphs[0] ?? "";
  const restParagraphs = parsed.paragraphs.slice(1);
  const firstChar = firstParagraph.charAt(0);
  const firstRest = firstParagraph.slice(1);

  const editHref = `/dashboard/journal/write?date=${entry.journalDateKey}`;

  const handleShare = async () => {
    const text = `${entry.title ?? "Reflection"}\n\n${entry.excerpt}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: entry.title ?? "Journal", text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleExport = () => {
    const blob = new Blob(
      [
        `${entry.title ?? "Reflection"}\n${headerDate}\n\n${parsed.paragraphs.join("\n\n")}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${entry.journalDateKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`relative min-h-[80vh] overflow-hidden rounded-calm px-4 pb-24 pt-6 md:px-8 ${
        isDark ? "bg-[#2b3331] text-white" : "bg-[#f9f8f4] text-text-primary"
      }`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(127,175,154,0.12), transparent 70%)",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-3xl"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={rise}
          className="flex items-center justify-between gap-4"
        >
          <Link
            href="/dashboard/journal"
            className={`text-xs font-semibold uppercase tracking-[0.18em] transition hover:opacity-80 ${
              isDark ? "text-white/55" : "text-text-primary/45"
            }`}
          >
            ← Back to garden
          </Link>
          <Link
            href={editHref}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              isDark
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-[#e7dacd] text-text-primary hover:bg-[#dfd0be]"
            }`}
          >
            <span aria-hidden>✎</span>
            Edit reflection
          </Link>
        </motion.div>

        <motion.header variants={rise} className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-primary/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              {category}
            </span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                isDark ? "text-white/45" : "text-text-primary/45"
              }`}
            >
              {headerDate}
            </span>
          </div>
          <h1
            className={`mt-6 font-display text-4xl font-semibold tracking-tight md:text-5xl ${
              isDark ? "text-white" : "text-text-primary"
            }`}
          >
            {entry.title ?? "Untitled reflection"}
          </h1>
          <p
            className={`mt-4 inline-flex items-center gap-2 text-base italic ${
              isDark ? "text-white/70" : "text-text-primary/60"
            }`}
          >
            <span aria-hidden>☺</span>
            {mood}
          </p>
        </motion.header>

        <motion.article variants={rise} className="mt-14 space-y-8">
          {firstParagraph ? (
            <p
              className={`text-lg leading-[1.85] md:text-xl ${
                isDark ? "text-white/88" : "text-text-primary/85"
              }`}
            >
              <span
                className={`float-left mr-3 mt-1 font-display text-6xl leading-none md:text-7xl ${
                  isDark ? "text-primary/90" : "text-text-secondary"
                }`}
              >
                {firstChar}
              </span>
              {firstRest}
            </p>
          ) : null}

          {restParagraphs.map((para, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.05, ease: easeCalm }}
              className={`text-lg leading-[1.85] md:text-xl ${
                isDark ? "text-white/88" : "text-text-primary/85"
              }`}
            >
              {para}
            </motion.p>
          ))}

          {(parsed.listItems.length > 0 || parsed.inlineImage) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: easeCalm }}
              className="grid gap-8 md:grid-cols-2 md:items-start"
            >
              <div
                className={`aspect-square overflow-hidden rounded-[28px] ${
                  isDark ? "bg-white/10" : "bg-accent/40"
                }`}
              >
                {parsed.inlineImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={parsed.inlineImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_40%_30%,#d4e8d8,#8fad9a_50%,#5a7a68)]" />
                )}
              </div>
              {parsed.listItems.length > 0 ? (
                <div>
                  <h2
                    className={`font-display text-2xl font-semibold ${
                      isDark ? "text-white" : "text-text-primary"
                    }`}
                  >
                    Reflection points
                  </h2>
                  <ul className="mt-6 space-y-5">
                    {parsed.listItems.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="flex gap-3"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/30 text-xs text-text-secondary">
                          ✓
                        </span>
                        <span
                          className={`text-base leading-relaxed ${
                            isDark ? "text-white/75" : "text-text-primary/70"
                          }`}
                        >
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.div>
          )}
        </motion.article>

        {parsed.quote ? (
          <motion.div
            ref={quoteRef}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={
              quoteInView
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.96, y: 24 }
            }
            transition={{ duration: 0.6, ease: easeCalm }}
            className={`relative mt-16 overflow-hidden rounded-[28px] p-8 md:p-10 ${
              isDark ? "bg-white/10" : "bg-white shadow-soft"
            }`}
          >
            <span
              className={`pointer-events-none absolute right-6 top-4 font-display text-[120px] leading-none ${
                isDark ? "text-white/10" : "text-text-primary/8"
              }`}
              aria-hidden
            >
              &rdquo;
            </span>
            <p
              className={`relative font-display text-xl font-semibold italic leading-relaxed md:text-2xl ${
                isDark ? "text-white" : "text-text-secondary"
              }`}
            >
              {parsed.quote.text}
            </p>
            <div className="relative mt-8 flex items-center gap-3">
              <span className={`h-px w-8 ${isDark ? "bg-white/30" : "bg-accent"}`} />
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  isDark ? "text-white/45" : "text-text-primary/45"
                }`}
              >
                {parsed.quote.label}
              </span>
            </div>
          </motion.div>
        ) : null}

        <motion.div
          variants={rise}
          className="mt-20 flex flex-wrap justify-center gap-10 md:gap-14"
        >
          {(
            [
              { id: "cherish", label: "Cherish", icon: "♥", onClick: () => setCherished((c) => !c) },
              { id: "share", label: "Share", icon: "⎘", onClick: () => void handleShare() },
              { id: "export", label: "Export", icon: "↓", onClick: handleExport },
            ] as const
          ).map((action) => (
            <motion.button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={hoverLiftTransition}
            >
              <span
                className={`grid h-14 w-14 place-content-center rounded-full border text-lg transition ${
                  action.id === "cherish" && cherished
                    ? "border-primary bg-primary/20 text-text-secondary"
                    : isDark
                      ? "border-white/25 text-white/70 hover:border-white/40"
                      : "border-text-primary/20 text-text-primary/55 hover:border-text-primary/35"
                }`}
              >
                {action.icon}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  isDark ? "text-white/45" : "text-text-primary/45"
                }`}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          variants={rise}
          className={`mx-auto mt-14 flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-full px-6 py-4 ${
            isDark ? "bg-white/10" : "bg-[#ececea]"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isDark ? "text-white/70" : "text-text-primary/60"
            }`}
          >
            How did reading this make you feel?
          </p>
          <div className="flex gap-2">
            {REACTIONS.map((emoji, i) => (
              <motion.button
                key={emoji}
                type="button"
                onClick={() => setSelectedReaction(i)}
                className={`text-xl transition ${
                  selectedReaction === i ? "scale-125" : "opacity-70 hover:opacity-100"
                }`}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`fixed bottom-8 right-6 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft md:right-10 ${
          isDark ? "bg-[#1f2826]" : "bg-white"
        }`}
      >
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent/40">
          <motion.span
            className="h-3 w-3 rounded-full bg-text-secondary"
            animate={{ scale: breathPhase === "inhale" ? [1, 1.35, 1] : [1.35, 1, 1.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-text-secondary">
            {breathPhase}
          </p>
          <p className={`text-xs ${isDark ? "text-white/50" : "text-text-primary/50"}`}>
            Breath guide active
          </p>
        </div>
      </motion.aside>
    </div>
  );
}
