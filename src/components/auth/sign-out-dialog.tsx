"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { easeCalm, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";

type SignOutDialogProps = {
  open: boolean;
  onClose: () => void;
  userLabel?: string | null;
  callbackUrl?: string;
};

export function SignOutDialog({
  open,
  onClose,
  userLabel,
  callbackUrl = "/",
}: SignOutDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signOut({ callbackUrl, redirect: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Couldn't sign you out. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
        >
          <motion.button
            type="button"
            aria-label="Cancel sign out"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: easeCalm }}
            onClick={() => {
              if (!submitting) onClose();
            }}
          />

          <motion.div
            className="relative z-1 w-full max-w-sm overflow-hidden rounded-calm bg-white p-6 shadow-[0_24px_80px_-24px_rgb(43_43_43/35%)] md:p-7"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={morphTransition}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdf0ee] text-[#cf4f45]"
                aria-hidden
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M15 17l5-5-5-5M20 12H9M12 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2
                  id="sign-out-title"
                  className="font-display text-xl font-semibold text-text-primary"
                >
                  Sign out of Apna Healer?
                </h2>
                <p className="mt-1 text-sm text-text-primary/65">
                  {userLabel
                    ? `You're currently signed in as ${userLabel}.`
                    : "We'll end your current session and take you back to the home page."}
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-gentle bg-[#fdf0ee] px-3 py-2 text-xs font-medium text-[#cf4f45]">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-accent/90 px-5 py-2.5 text-sm font-semibold text-text-primary/75 transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Stay signed in
              </button>
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cf4f45] px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                whileHover={!submitting ? { scale: 1.03, y: -1 } : undefined}
                whileTap={!submitting ? { scale: 0.97 } : undefined}
                transition={hoverLiftTransition}
              >
                {submitting ? "Signing out…" : "Sign out"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
