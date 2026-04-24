"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Theme-aligned cubic-bezier from globals `--ease-calm` */
export const easeCalm: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const morphTransition = {
  duration: 0.5,
  ease: easeCalm,
} as const;

export const hoverLiftTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 26,
  mass: 0.85,
};

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay, ease: easeCalm }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
