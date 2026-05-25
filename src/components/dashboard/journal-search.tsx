"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { easeCalm } from "@/components/ui/fade-in";

const PLACEHOLDERS = [
  "Whisper a word your heart remembers…",
  "Search for rain, breath, or a quiet morning…",
  "Trace a feeling back through the garden…",
  "What thread still lingers from last week?",
  "Find the entry where you finally exhaled…",
] as const;

const WHISPERS = [
  { label: "Morning calm", query: "morning calm", icon: "🌅" },
  { label: "Gratitude", query: "grateful thank", icon: "🌿" },
  { label: "Heavy days", query: "heavy difficult", icon: "🌧️" },
  { label: "Breath & ground", query: "breath breathe", icon: "🫁" },
  { label: "Stillness", query: "still quiet silence", icon: "✨" },
  { label: "Intentions", query: "intention forward", icon: "🕯️" },
] as const;

type JournalSearchProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  isSearching?: boolean;
  totalInGarden?: number;
};

export function JournalSearch({
  value,
  onChange,
  resultCount,
  isSearching = false,
  totalInGarden,
}: JournalSearchProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const showRotatingPlaceholder = !focused && !value.trim();

  useEffect(() => {
    if (!showRotatingPlaceholder) return;
    const timer = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [showRotatingPlaceholder]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeQuery = value.trim();

  return (
    <div className="space-y-4">
      <motion.div
        layout
        className={`relative overflow-hidden rounded-[2rem] border transition-[border-color,box-shadow] duration-500 ${
          focused
            ? "border-primary/35 bg-white shadow-[0_8px_40px_-12px_rgb(47_93_80/18%)]"
            : "border-accent/70 bg-[#faf9f6] shadow-soft"
        }`}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{
            opacity: focused ? 0.55 : 0.25,
            scale: focused ? 1.05 : 1,
          }}
          transition={{ duration: 0.8, ease: easeCalm }}
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(127 175 154 / 22%), transparent 70%)",
          }}
        />

        <div className="relative flex items-center gap-3 px-5 py-4 md:px-6 md:py-5">
          <motion.span
            animate={{ rotate: focused ? 12 : 0, scale: focused ? 1.08 : 1 }}
            transition={{ duration: 0.45, ease: easeCalm }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-lg"
            aria-hidden
          >
            🌱
          </motion.span>

          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              Search your journal garden
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent font-display text-lg font-medium text-text-primary outline-none md:text-xl"
                autoComplete="off"
                spellCheck={false}
              />
              {showRotatingPlaceholder ? (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center"
                  aria-hidden
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={placeholderIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.4, ease: easeCalm }}
                      className="truncate text-lg text-text-primary/35 md:text-xl"
                    >
                      {PLACEHOLDERS[placeholderIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ) : null}
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary/40">
              {focused ? "Listening to your garden…" : "Ctrl/⌘K to wander"}
            </p>
          </div>

          <AnimatePresence>
            {activeQuery ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25, ease: easeCalm }}
                onClick={() => onChange("")}
                className="shrink-0 rounded-full border border-accent/80 bg-white px-3 py-1.5 text-xs font-semibold text-text-primary/55 transition hover:border-primary/30 hover:text-text-secondary"
              >
                Clear path
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
          Whispers to try
        </span>
        {WHISPERS.map((whisper, index) => {
          const isActive = activeQuery === whisper.query;
          return (
            <motion.button
              key={whisper.label}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.4, ease: easeCalm }}
              onClick={() => onChange(isActive ? "" : whisper.query)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition duration-300 ${
                isActive
                  ? "border-primary/40 bg-primary/15 text-text-secondary"
                  : "border-accent/80 bg-white/90 text-text-primary/65 hover:border-primary/25 hover:bg-primary/8"
              }`}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <span aria-hidden>{whisper.icon}</span>
              {whisper.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.p
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm italic text-text-primary/50"
          >
            Walking through the leaves…
          </motion.p>
        ) : activeQuery && resultCount !== undefined ? (
          <motion.p
            key={`results-${resultCount}-${activeQuery}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: easeCalm }}
            className="text-sm text-text-primary/60"
          >
            {resultCount === 0 ? (
              <>
                No reflections stirred by{" "}
                <span className="font-semibold text-text-secondary">
                  &ldquo;{activeQuery}&rdquo;
                </span>
                — try another whisper.
              </>
            ) : (
              <>
                <span className="font-display text-lg font-semibold text-text-secondary">
                  {resultCount}
                </span>{" "}
                {resultCount === 1 ? "memory" : "memories"} surfaced from{" "}
                <span className="italic text-text-primary/75">
                  &ldquo;{activeQuery}&rdquo;
                </span>
              </>
            )}
          </motion.p>
        ) : totalInGarden !== undefined && totalInGarden > 0 ? (
          <motion.p
            key="garden-count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-text-primary/45"
          >
            {totalInGarden} {totalInGarden === 1 ? "reflection" : "reflections"} resting in
            your garden
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
