"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { apiFetch } from "@/lib/api-client";

const revealUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string; message: string }>("/api/public/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, message }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setMessage("");
      setFormError(null);
    },
    onError: (error: Error) => {
      setFormError(error.message || "Could not send your message. Please try again.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      setFormError("Please enter your name, email, and a message of at least 10 characters.");
      return;
    }
    submitMutation.mutate();
  };

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
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#44514e]">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={10}
                    className="w-full resize-none rounded-xl bg-[#f1f1ef] px-4 py-3 text-sm text-[#2f3332] outline-none ring-1 ring-transparent transition focus:ring-[#2f745f]"
                  />
                </div>

                {formError ? (
                  <p className="mt-4 text-sm font-medium text-[#b4534a]">{formError}</p>
                ) : null}
                {submitMutation.isSuccess ? (
                  <p className="mt-4 text-sm font-medium text-[#2f745f]">
                    {submitMutation.data?.message ?? "Thank you. We will respond soon."}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="mt-6 rounded-full bg-[#2f745f] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#255b4a] disabled:opacity-60"
                >
                  {submitMutation.isPending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </motion.article>

            <motion.aside
              className="rounded-[26px] bg-[#2f745f] p-8 text-white"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-[34px] font-semibold tracking-[-0.02em]">
                Apna healer Support
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#cde4dc]">
                Our care team typically responds within one business day. For urgent
                mental health crises, please contact your local emergency services.
              </p>
              <div className="mt-8 space-y-4 text-sm">
                <p>
                  <span className="font-semibold uppercase tracking-widest text-[#a8d4c4]">
                    Email
                  </span>
                  <br />
                  hello@apnahealer.com
                </p>
                <p>
                  <span className="font-semibold uppercase tracking-widest text-[#a8d4c4]">
                    Hours
                  </span>
                  <br />
                  Mon–Fri, 9:00 AM – 6:00 PM IST
                </p>
              </div>
            </motion.aside>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
