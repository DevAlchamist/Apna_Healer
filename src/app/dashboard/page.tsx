"use client";

import { useBookSessionModal } from "@/components/dashboard/book-session-modal";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";

const listeners = [
  { name: "Sarah J.", role: "Trauma Support" },
  { name: "David K.", role: "Anxiety Specialist" },
  { name: "Elena R.", role: "Grief Counseling" },
  { name: "Marcus T.", role: "Career Stress" },
];

export default function DashboardPage() {
  const { open: openBookSession } = useBookSessionModal();

  return (
    <FadeIn className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/45">
          Live Listeners Online
        </p>
        <p className="text-xs font-semibold text-text-secondary">24 Available Now</p>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {listeners.map((listener, index) => (
          <motion.button
            key={listener.name}
            type="button"
            onClick={() =>
              openBookSession({
                name: listener.name,
                specialty: listener.role,
                imageSrc: null,
              })
            }
            className="group flex w-full cursor-pointer items-center gap-3 rounded-calm border border-accent/70 bg-white p-3 text-left transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/25 hover:shadow-soft-hover"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...morphTransition, delay: 0.04 + index * 0.06 }}
            whileHover={{ y: -4, transition: hoverLiftTransition }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-accent transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{listener.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-text-primary/55">{listener.role}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <motion.section
          className="rounded-calm bg-linear-to-r from-[#d6e7df] to-[#bde2cf] p-6 shadow-soft transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover md:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.08 }}
          whileHover={{ y: -5, transition: hoverLiftTransition }}
        >
          <p className="inline-flex rounded-full bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Upcoming Today
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-[#0d2f2a] md:text-6xl">
            Session with
            <br />
            Dr. Aris Thorne
          </h1>
          <p className="mt-4 text-lg text-[#1b6054]">Focused Therapy: Attachment Theory</p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <p className="text-sm font-semibold text-[#0f5147]">4:30 PM</p>
              <p className="text-sm font-semibold text-[#0f5147]">Video Session</p>
            </div>
            <motion.button
              type="button"
              className="rounded-full bg-[#045b4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(4_91_79/45%)]"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              Join Meeting
            </motion.button>
          </div>
        </motion.section>

        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-accent hover:shadow-soft-hover md:p-7"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.12 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Living Mood Trend</h2>
            <span className="text-sm font-semibold text-text-secondary">+14%</span>
          </div>

          <div className="mt-6 flex h-28 items-end gap-2 rounded-gentle bg-background/70 px-4 pb-3">
            {(
              [
                { h: "h-8", bg: "bg-accent/70" },
                { h: "h-12", bg: "bg-accent/80" },
                { h: "h-10", bg: "bg-accent/70" },
                { h: "h-16", bg: "bg-accent/80" },
                { h: "h-20", bg: "bg-primary/70" },
                { h: "h-14", bg: "bg-accent/70" },
                { h: "h-11", bg: "bg-accent/70" },
              ] as const
            ).map((bar, i) => (
              <motion.span
                key={i}
                className={`w-7 rounded-t ${bar.h} ${bar.bg}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...morphTransition, delay: 0.16 + i * 0.04 }}
                style={{ transformOrigin: "bottom" }}
                whileHover={{ scaleY: 1.08, transition: hoverLiftTransition }}
              />
            ))}
          </div>

          <p className="mt-5 text-sm text-text-primary/70">
            You&apos;re feeling <span className="font-semibold text-text-secondary">Centered</span> this week.
            Your mood has increased by 14% since Sunday.
          </p>
        </motion.section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.14 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Recent Journal</h2>
            <motion.span
              className="cursor-pointer text-sm text-text-primary/45 transition-colors hover:text-text-secondary"
              whileHover={{ x: 2 }}
              transition={hoverLiftTransition}
            >
              Open
            </motion.span>
          </div>
          <blockquote className="mt-5 rounded-gentle bg-background/70 p-4 text-text-primary/75 transition-colors duration-500 hover:bg-accent/25">
            &quot;The forest today was incredibly quiet. I noticed how the light filter through the pine
            needles. It made me realize that even in darkness, there are patterns of light worth
            finding...&quot;
          </blockquote>
          <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-primary/45">
            <span>Written 2 hours ago</span>
            <span>Private</span>
          </div>
        </motion.section>

        <motion.section
          className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-soft-hover"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...morphTransition, delay: 0.18 }}
          whileHover={{ y: -4, transition: hoverLiftTransition }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Enrolled Events</h2>
            <motion.span
              className="cursor-pointer text-sm font-semibold text-text-secondary"
              whileHover={{ x: 3 }}
              transition={hoverLiftTransition}
            >
              View Calendar
            </motion.span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { title: "Forest Bathing", sub: "Oct 24 - 08:00 AM", from: "from-[#294c2b]", to: "to-[#9bb770]" },
              { title: "Sunset Meditation", sub: "Oct 26 - 05:45 PM", from: "from-[#df8d2f]", to: "to-[#243a53]" },
            ].map((ev, index) => (
              <motion.article
                key={ev.title}
                className="group cursor-pointer space-y-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphTransition, delay: 0.22 + index * 0.06 }}
                whileHover={{ y: -3, transition: hoverLiftTransition }}
              >
                <div
                  className={`h-28 rounded-gentle bg-linear-to-r ${ev.from} ${ev.to} transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]`}
                />
                <p className="text-xl font-semibold text-text-primary">{ev.title}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-primary/45">{ev.sub}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>
      </div>
    </FadeIn>
  );
}
