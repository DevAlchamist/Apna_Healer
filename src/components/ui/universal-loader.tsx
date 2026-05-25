"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes } from "react";

const logoEase = [0.22, 1, 0.36, 1] as const;
const textEase = [0.33, 1, 0.32, 1] as const;

export type UniversalLoaderProps = {
  /** When true, fills the viewport (e.g. route loading). */
  fullscreen?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/**
 * Brand loader: logo scales in with fade, “Apna Healer” slides out from behind the mark, then a subtle logo pulse.
 */
export function UniversalLoader({
  fullscreen = false,
  className = "",
  ...rest
}: UniversalLoaderProps) {
  const reduce = useReducedMotion();

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex items-center justify-center ${fullscreen ? "min-h-[min(100dvh,100vh)] w-full bg-background" : ""} ${className}`.trim()}
      {...rest}
    >
      <span className="sr-only">Loading</span>
      <div className="inline-flex items-center">
        <motion.div
          className="relative z-20 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]"
          initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.58, ease: logoEase }
          }
        >
          <motion.div
            className="h-full w-full will-change-transform"
            initial={{ scale: 1 }}
            animate={reduce ? { scale: 1 } : { scale: [1, 1.04, 1] }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    delay: 1.02,
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static public SVG, avoids Image config */}
            <img
              src="/logo.svg"
              alt=""
              width={84}
              height={80}
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        <motion.span
          className="relative z-10 whitespace-nowrap font-display text-lg font-semibold tracking-tight text-text-secondary sm:text-xl"
          initial={
            reduce
              ? { opacity: 1, marginLeft: "0.75rem", x: 0 }
              : { opacity: 0, marginLeft: "-3.125rem", x: -18 }
          }
          animate={{ opacity: 1, marginLeft: "0.75rem", x: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { delay: 0.48, duration: 0.52, ease: textEase }
          }
        >
          Apna Healer
        </motion.span>
      </div>
    </div>
  );
}
