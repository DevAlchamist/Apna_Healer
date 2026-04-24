"use client";

import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedDashboardPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AnimatedDashboardPage({ title, description, children }: AnimatedDashboardPageProps) {
  return (
    <FadeIn className="space-y-8 md:space-y-10">
      <motion.header
        className="space-y-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <motion.h1
          className="font-display text-4xl font-semibold text-text-secondary md:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.04 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="max-w-xl text-lg leading-relaxed text-text-primary/75"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </motion.header>

      {children ?? (
        <motion.div
          className="rounded-calm border border-accent/70 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/25 hover:shadow-soft-hover md:p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.14 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <p className="text-sm leading-relaxed text-text-primary/60">
            More tools and content will appear here as we grow the experience.
          </p>
        </motion.div>
      )}
    </FadeIn>
  );
}
