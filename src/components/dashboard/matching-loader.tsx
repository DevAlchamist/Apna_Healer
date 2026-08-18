"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type MatchingMode = "therapist" | "listener";

interface MatchingCopy {
  headline: string;
  subline: string;
  steps: string[];
  duration: number;
}

const matchingCopy: Record<MatchingMode, MatchingCopy> = {
  therapist: {
    headline: "Finding the right support for you…",
    subline:
      "We’re checking availability, expertise, language, and preferences to find the best match.",
    steps: [
      "Checking availability…",
      "Finding the right expertise…",
      "Looking at your preferences…",
      "Almost there…",
    ],
    duration: 6000,
  },
  listener: {
    headline: "Finding someone who’s ready to listen…",
    subline: "No forms, no waiting room. Just someone warm on the other side of this.",
    steps: [
      "Checking who’s available…",
      "Finding someone who’s ready to listen…",
      "Connecting you with a listener…",
    ],
    duration: 5000,
  },
};

const EASE = [0.23, 1, 0.32, 1] as const;

const CIRCLES = [
  { color: "#CBDCC6", from: -34, delay: 0 },
  { color: "#D9D1EA", from: 34, delay: 0.6 },
  { color: "#F3D2BC", from: 0, delay: 1.2 },
];

function MatchingVisual() {
  const reduceMotion = useReducedMotion();
  const easeAnimation = [0.42, 0, 0.58, 1] as const;

  if (reduceMotion) {
    return (
      <div className="relative mx-auto flex h-40 w-full max-w-[15rem] items-center justify-center" aria-hidden="true">
        {CIRCLES.map((circle, index) => (
          <span
            key={circle.color}
            className="absolute h-[5.5rem] w-[5.5rem] rounded-full mix-blend-multiply"
            style={{
              backgroundColor: circle.color,
              transform: `translate(${circle.from * 0.3}px, ${index === 2 ? 14 : -8}px)`,
            }}
          />
        ))}
        <span className="absolute h-2.5 w-2.5 rounded-full bg-[#2E4739]" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-40 w-full max-w-[15rem]" aria-hidden="true">
      <motion.span
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E3ECE5]"
        animate={{ scale: [1, 1.85], opacity: [0.55, 0] }}
        transition={{ duration: 4.5, ease: easeAnimation, repeat: Infinity }}
      />

      <motion.span
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D9D1EA]/65"
        animate={{ scale: [1, 1.85], opacity: [0.5, 0] }}
        transition={{ duration: 4.5, ease: easeAnimation, repeat: Infinity, delay: 2.25 }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {CIRCLES.map((circle) => (
          <motion.span
            key={circle.color}
            className="absolute h-[5.5rem] w-[5.5rem] rounded-full mix-blend-multiply"
            style={{ backgroundColor: circle.color }}
            animate={{
              x: [circle.from, circle.from * 0.25, circle.from],
              y: circle.from === 0 ? [26, 8, 26] : [-14, -4, -14],
              opacity: [0.75, 0.95, 0.75],
            }}
            transition={{ duration: 6.5, ease: easeAnimation, repeat: Infinity, delay: circle.delay }}
          />
        ))}

        <motion.span
          className="absolute h-2.5 w-2.5 rounded-full bg-[#2E4739]"
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.2, ease: easeAnimation, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

interface MatchingLoaderProps {
  open: boolean;
  mode: MatchingMode;
  onCancel: () => void;
  onComplete?: () => void;
  inline?: boolean;
}

export function MatchingLoader({
  open,
  mode,
  onCancel,
  onComplete,
  inline = false,
}: MatchingLoaderProps) {
  const copy = matchingCopy[mode];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }

    const interval = copy.duration / copy.steps.length;
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, copy.steps.length - 1));
    }, interval);

    const done = onComplete ? window.setTimeout(onComplete, copy.duration) : undefined;

    return () => {
      window.clearInterval(timer);
      if (done) window.clearTimeout(done);
    };
  }, [open, copy, onComplete]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  const content = (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={copy.headline}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-[#FBF8F3] px-8 pb-10 pt-12 text-center sm:px-14 sm:pb-12 sm:pt-14"
    >
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#6E9179] font-bold">
        {mode === "therapist" ? "Matching you with a therapist" : "Matching you with a listener"}
      </p>

      <div className="mt-9">
        <MatchingVisual />
      </div>

      <h2 className="mt-8 font-display text-[1.6rem] leading-snug text-[#2E4739] font-bold sm:text-[1.85rem]">
        {copy.headline}
      </h2>
      <p className="mx-auto mt-4 max-w-[38ch] text-[0.95rem] leading-relaxed text-[#5F5A52] font-semibold">
        {copy.subline}
      </p>

      <div className="mt-9">
        <div className="mx-auto h-px w-full max-w-xs bg-[#EAE3D8]">
          <motion.div
            className="h-px bg-[#2E4739]"
            initial={{ width: "8%" }}
            animate={{ width: "100%" }}
            transition={{ duration: copy.duration / 1000, ease: "linear" }}
          />
        </div>

        <div className="mt-6 flex h-6 items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={copy.steps[stepIndex]}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: EASE }}
              className="text-[0.85rem] text-[#2E4739] font-bold"
            >
              {copy.steps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-[#6E9179]"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: dot * 0.3 }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-10 text-xs text-[#8C867C] font-semibold transition hover:text-[#2E4739] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Take your time — pause the search
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {open &&
        (inline ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#faf9f5] px-5 py-12 overflow-y-auto">
            {content}
          </div>
        ) : (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="absolute inset-0 bg-[#2E4739]/45 backdrop-blur-sm"
            />
            {content}
          </div>
        ))}
    </AnimatePresence>
  );
}
