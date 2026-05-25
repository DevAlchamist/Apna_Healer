"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import type { ApiUser } from "@/types/api";
import { hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { ListenerApplicationModal } from "@/components/dashboard/professional-apply/listener-application-modal";
import { TherapistApplicationModal } from "@/components/dashboard/professional-apply/therapist-application-modal";

const FOREST = "#2D5A4C";

export function ProfileProfessionalCta({ user }: { user: ApiUser }) {
  const [listenerOpen, setListenerOpen] = useState(false);
  const [therapistOpen, setTherapistOpen] = useState(false);

  if (user.role === "ADMIN") {
    return null;
  }

  const isListener = user.role === "LISTENER";
  const isTherapist = user.role === "THERAPIST";
  const listenerPending = user.applications?.some((a) => a.type === "LISTENER" && a.status === "PENDING");
  const therapistPending = user.applications?.some((a) => a.type === "THERAPIST" && a.status === "PENDING");

  return (
    <>
      <motion.section
        className="relative overflow-hidden rounded-[1.5rem] px-6 py-8 md:px-10 md:py-10"
        style={{ backgroundColor: FOREST }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...morphTransition, delay: 0.28 }}
      >
        <motion.div
          className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-black/15"
          aria-hidden
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...morphTransition, delay: 0.35 }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">Elevate your practice.</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">
              {isTherapist ? (
                <>
                  Scale your clinical impact with structured mentorship, or mentor the next generation of healers in
                  our global atrium.
                </>
              ) : isListener ? (
                <>
                  Deepen your listening craft through <strong className="font-semibold text-white">Advanced Mentorship</strong>{" "}
                  programs, or explore lead-listener pathways when you are ready.
                </>
              ) : (
                <>
                  Looking to scale your impact? Explore our{" "}
                  <strong className="font-semibold text-white">Advanced Mentorship</strong> programs or open applications
                  to become a Lead Listener in our global atrium.
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/resources"
              className="inline-flex items-center justify-center rounded-full bg-[#b8e6d0] px-5 py-2.5 text-sm font-semibold text-[#1a3d32] shadow-sm transition hover:bg-[#c9f0e0]"
            >
              Join mentorship
            </Link>
            {isListener ? (
              <Link
                href="/dashboard/listener-inbox"
                className="inline-flex items-center justify-center rounded-full border border-white/50 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Listener workspace
              </Link>
            ) : isTherapist ? (
              <Link
                href="/dashboard/consultations"
                className="inline-flex items-center justify-center rounded-full border border-white/50 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Therapist workspace
              </Link>
            ) : (
              <>
                {!listenerPending ? (
                  <motion.button
                    type="button"
                    onClick={() => setListenerOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-white/50 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={hoverLiftTransition}
                  >
                    Apply as listener
                  </motion.button>
                ) : null}
                {!therapistPending ? (
                  <motion.button
                    type="button"
                    onClick={() => setTherapistOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={hoverLiftTransition}
                  >
                    Apply as therapist
                  </motion.button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </motion.section>

      <ListenerApplicationModal open={listenerOpen} onClose={() => setListenerOpen(false)} />
      <TherapistApplicationModal open={therapistOpen} onClose={() => setTherapistOpen(false)} />
    </>
  );
}
