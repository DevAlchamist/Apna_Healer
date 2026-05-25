"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

export type ApplicationFormModalVariant = "listener" | "therapist";

export const applicationLabelClass =
  "grid gap-2 text-[13px] font-semibold tracking-tight text-[#2a3532]";

export const applicationInputClass =
  "w-full rounded-xl border border-[#e2d9cf] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-text-primary shadow-[inset_0_1px_2px_rgba(36,50,48,0.04)] outline-none transition placeholder:text-text-primary/36 hover:border-[#d4c9bc] focus:border-[#3e725f]/55 focus:ring-[3px] focus:ring-[#3e725f]/12 disabled:cursor-not-allowed disabled:bg-[#f7f4f0]/80 disabled:opacity-70";

export const applicationSelectClass =
  "w-full cursor-pointer rounded-xl border border-[#e2d9cf] bg-white px-3 py-2.5 text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(36,50,48,0.04)] outline-none transition hover:border-[#d4c9bc] focus:border-[#3e725f]/55 focus:ring-[3px] focus:ring-[#3e725f]/12 disabled:cursor-not-allowed disabled:opacity-70";

function ModalHeaderIcon({ variant }: { variant: ApplicationFormModalVariant }) {
  if (variant === "listener") {
    return (
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-emerald-50 to-[#dff4e7] text-[#2f6f5b] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-emerald-900/10"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.65">
          <circle cx="8" cy="9" r="3.2" />
          <path d="M3.5 18a4.5 4.5 0 0 1 9 0" strokeLinecap="round" />
          <path d="M16 8h4M16 12h4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-[#edf8f2] to-[#dff4e7] text-[#3e725f] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#3e725f]/14"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.65">
        <path d="M7 5h10v14H7z" />
        <path d="M9.5 9.5h5M9.5 13.5h5M9.5 17.5H13" strokeLinecap="round" />
        <path d="M9 3.5h6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

type ApplicationFormModalProps = {
  open: boolean;
  onClose: () => void;
  variant: ApplicationFormModalVariant;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function ApplicationFormModal({
  open,
  onClose,
  variant,
  eyebrow,
  title,
  description,
  children,
  footer,
}: ApplicationFormModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="application-form-modal"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-[#1c2824]/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
            className="relative z-10 flex max-h-[min(92dvh,880px)] w-full max-w-xl flex-col overflow-hidden rounded-t-[26px] border border-white/80 bg-white shadow-[0_28px_90px_-32px_rgba(36,50,48,0.48)] ring-1 ring-black/5 sm:rounded-[28px]"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.4, ease }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative shrink-0 border-b border-[#efe8df] bg-linear-to-b from-white via-white to-[#faf7f3] px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
              <div className="flex items-start gap-4">
                <ModalHeaderIcon variant={variant} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7f72]">{eyebrow}</p>
                  <h2
                    id="application-modal-title"
                    className="mt-1.5 font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-[#243230] sm:text-[1.85rem]"
                  >
                    {title}
                  </h2>
                  {description ? (
                    <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-text-primary/58 sm:text-sm">{description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#6d7a76] transition hover:bg-[#f1ebe4] hover:text-[#243230] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e725f]/40"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-7 sm:py-6">{children}</div>

            <footer className="shrink-0 border-t border-[#efe8df] bg-linear-to-t from-[#f4efe8] to-[#faf8f5] px-5 py-4 sm:px-7 sm:py-5">
              {footer}
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ApplicationFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-linear-to-r from-transparent via-[#e4dcd2] to-[#e4dcd2]" />
        <h3 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7f72]">{title}</h3>
        <span className="h-px flex-1 bg-linear-to-l from-transparent via-[#e4dcd2] to-[#e4dcd2]" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
