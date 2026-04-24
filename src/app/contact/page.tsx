"use client";

import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

const revealUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

export default function ContactPage() {
  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar />
      <main>
        <motion.section
          className="mx-auto max-w-[1240px] px-6 pb-16 pt-14 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <p className="mx-auto inline-flex rounded-full bg-[#d4eadf] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#2f745f]">
            Get in Touch
          </p>
          <h1 className="mt-5 text-center text-[66px] font-semibold tracking-[-0.03em] text-[#232c2b]">
            We&apos;re here to listen too
          </h1>
          <p className="mx-auto mt-4 max-w-[780px] text-center text-[18px] leading-8 text-[#6f7977]">
            Whether you have a question about our services, need help navigating
            the platform, or simply want to share your journey, our space is
            open for you.
          </p>

          <div className="mt-11 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <motion.article
              className="rounded-[26px] bg-white p-8 shadow-[0_18px_34px_-30px_rgba(0,0,0,0.45)]"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#44514e]">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="h-12 w-full rounded-xl bg-[#f1f1ef] px-4 text-sm text-[#2f3332] outline-none ring-1 ring-transparent transition focus:ring-[#2f745f]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#44514e]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="hello@example.com"
                    className="h-12 w-full rounded-xl bg-[#f1f1ef] px-4 text-sm text-[#2f3332] outline-none ring-1 ring-transparent transition focus:ring-[#2f745f]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-[#44514e]">
                  How can we help?
                </label>
                <textarea
                  placeholder="Share your thoughts with us..."
                  rows={5}
                  className="w-full resize-none rounded-xl bg-[#f1f1ef] px-4 py-3 text-sm text-[#2f3332] outline-none ring-1 ring-transparent transition focus:ring-[#2f745f]"
                />
              </div>

              <button className="mt-6 rounded-full bg-[#2f745f] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255b4a]">
                Send Message
              </button>
            </motion.article>

            <div className="space-y-6">
              <motion.article
                className="rounded-[24px] bg-[#ece6df] p-7"
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.35 }}
              >
                <h2 className="text-[40px] font-semibold tracking-[-0.02em] text-[#2c3433]">
                  Quick Support
                </h2>
                <div className="mt-5 space-y-4">
                  {[
                    ["Visit our FAQ", "Common questions answered"],
                    ["Report an Issue", "Help us improve our community"],
                    ["General Inquiries", "support@apnahealer.com"],
                  ].map(([title, subtitle]) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="mt-1 grid h-7 w-7 place-content-center rounded-full border border-[#8aa39b] text-[11px] text-[#2f745f]">
                        ○
                      </div>
                      <div>
                        <p className="text-[17px] font-semibold text-[#34403e]">{title}</p>
                        <p className="text-sm text-[#74807d]">{subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.article>

              <motion.article
                className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_60%_20%,#8bc0d1,#16465d_44%,#0f2838)] p-7"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-[176px]" />
                <p className="absolute bottom-5 left-7 max-w-[350px] text-[22px] italic leading-8 text-white">
                  Healing takes courage, and we all have courage, even if we
                  have to dig a little to find it.
                </p>
              </motion.article>
            </div>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
