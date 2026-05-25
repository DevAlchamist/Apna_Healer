"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiMutation } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";

type WelcomeBonusModalProps = {
  open: boolean;
  amount: number;
  userName?: string | null;
};

export function WelcomeBonusModal({ open, amount, userName }: WelcomeBonusModalProps) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(open);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  const claimMutation = useMutation({
    mutationFn: () =>
      apiMutation<{ alreadyClaimed: boolean }>(
        "/api/users/me/welcome-bonus/claim",
        "POST",
      ),
    onSettled: () => {
      // Refresh both the user profile (welcomeBonus flag) and the wallet balance
      // so the dashboard reflects the new healing points immediately.
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onSuccess: (data) => {
      // Optimistically update the cached profile so the modal stays dismissed
      // even before the refetch completes.
      queryClient.setQueryData<ApiUser | undefined>(["user-me"], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          welcomeBonus: prev.welcomeBonus
            ? { ...prev.welcomeBonus, available: false, claimed: true }
            : prev.welcomeBonus,
        };
      });
      // Use the result to silence unused-var lint without leaking it.
      void data;
    },
  });

  const handleClaim = async () => {
    setDismissing(true);
    try {
      await claimMutation.mutateAsync();
    } finally {
      setVisible(false);
      setDismissing(false);
    }
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="welcome-bonus-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: easeCalm }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-bonus-title"
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-calm bg-white p-8 text-center shadow-soft-hover"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={morphTransition}
          >
            <ConfettiSparkles />

            <motion.div
              className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#bde2cf] via-[#d6e7df] to-[#fbe7c8] shadow-soft"
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...morphTransition, delay: 0.05 }}
            >
              <motion.span
                className="absolute inset-0 rounded-full border border-[#22c997]/40"
                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: easeCalm }}
              />
              <span className="font-display text-3xl font-semibold text-[#0f5147]">
                +{amount}
              </span>
            </motion.div>

            <motion.p
              className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-text-primary/55"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.12 }}
            >
              Welcome to Apna Healer
            </motion.p>
            <motion.h2
              id="welcome-bonus-title"
              className="mt-2 font-display text-3xl font-semibold leading-tight text-text-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.16 }}
            >
              {userName ? `Congratulations, ${userName.split(" ")[0]}!` : "Congratulations!"}
            </motion.h2>
            <motion.p
              className="mt-3 text-sm leading-relaxed text-text-primary/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphTransition, delay: 0.2 }}
            >
              You just earned{" "}
              <span className="font-semibold text-text-primary">
                {amount} healing points
              </span>{" "}
              as your joining gift. Use them toward your first session, package,
              or community circle.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleClaim}
              disabled={dismissing || claimMutation.isPending}
              className="mt-7 inline-flex items-center justify-center rounded-full bg-[#045b4f] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)] disabled:cursor-not-allowed disabled:opacity-70"
              whileHover={
                dismissing || claimMutation.isPending
                  ? undefined
                  : { scale: 1.04, y: -1 }
              }
              whileTap={
                dismissing || claimMutation.isPending
                  ? undefined
                  : { scale: 0.97 }
              }
              transition={hoverLiftTransition}
            >
              {dismissing || claimMutation.isPending
                ? "Crediting..."
                : "Start Healing"}
            </motion.button>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary/40">
              Your wallet has been topped up
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConfettiSparkles() {
  const dots = [
    { left: "12%", top: "18%", delay: 0.1, color: "#22c997" },
    { left: "82%", top: "22%", delay: 0.18, color: "#f5b961" },
    { left: "18%", top: "78%", delay: 0.24, color: "#7aa9c8" },
    { left: "86%", top: "70%", delay: 0.3, color: "#cf6f63" },
    { left: "50%", top: "8%", delay: 0.14, color: "#045b4f" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{ left: d.left, top: d.top, backgroundColor: d.color }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.7, 1], scale: [0, 1.2, 1] }}
          transition={{
            duration: 1.4,
            delay: d.delay,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: easeCalm,
          }}
        />
      ))}
    </div>
  );
}
