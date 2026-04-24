"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

const heroSlides = [
  {
    title: "Feel Together,",
    highlight: "Heal Together.",
    description:
      "Step into a sanctuary designed for your mental well-being. Whether you need a listening ear or professional guidance, we cradle your journey with care.",
    visual:
      "bg-[radial-gradient(circle_at_50%_20%,#d6c4a4,#8f6e4a_45%,#3f2b1f)]",
  },
  {
    title: "Speak Freely,",
    highlight: "Breathe Deeply.",
    description:
      "A calming digital home where every conversation is held with empathy, confidentiality, and a sense of belonging.",
    visual:
      "bg-[radial-gradient(circle_at_55%_30%,#b8ddd1,#5f8f7f_48%,#2b5045)]",
  },
  {
    title: "Grow Gently,",
    highlight: "Shine Daily.",
    description:
      "From listeners to licensed therapists, find the right support circle and keep your emotional wellness journey moving forward.",
    visual:
      "bg-[radial-gradient(circle_at_48%_20%,#e6d4b7,#aa8862_45%,#5e4732)]",
  },
] as const;

const listeners = [
  "Elena",
  "Marcus",
  "Sarah",
  "David",
  "Ava",
  "Noah",
  "Zara",
  "Ibrahim",
] as const;

const voiceColumns = [
  [
    "The ability to find a listener at 2 AM when anxiety was peaking saved my week.",
    "The matching algorithm actually works. My therapist understands my cultural background deeply.",
    "I finally feel like I can ask for help without being judged.",
  ],
  [
    "Finally a place that feels soft and professional. Most apps feel rushed.",
    "The rituals and events keep me grounded every single day.",
    "I went from overwhelmed to supported in less than one week.",
  ],
  [
    "I was skeptical at first, but the empathy I received was incredible.",
    "Quiet, beautiful design that does not overwhelm. The sanctuary is my favorite corner.",
    "Even short check-ins make a huge difference in my mood.",
  ],
] as const;

const faqItems = [
  {
    question: "How do I know if I need a therapist or a listener?",
    answer:
      "Therapists are trained professionals for deep clinical work. Listeners provide peer support and empathy for everyday challenges.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. We follow strong data protection practices, secure storage, and strict access controls to keep your information safe.",
  },
  {
    question: "How are listeners vetted?",
    answer:
      "Listeners go through screening, empathy assessments, and platform onboarding before they are made available for sessions.",
  },
  {
    question: "Can I switch therapists if it's not a match?",
    answer:
      "Absolutely. You can request a new therapist anytime so you can find the support relationship that feels right for you.",
  },
] as const;

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpStage, setIsOtpStage] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isJoinModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isJoinModalOpen]);

  const openJoinModal = () => {
    setModalMethod("email");
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpStage(false);
    setIsJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
  };

  const handlePhoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      return;
    }
    setIsOtpStage(true);
  };

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpCode.trim()) {
      return;
    }
  };

  const marqueeListeners = useMemo(() => [...listeners, ...listeners], []);

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar onJoinClick={openJoinModal} />
      <main>
        <motion.section
          id="about"
          className="mx-auto max-w-[1240px] px-6 pb-16 pt-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              key={heroSlides[heroIndex].title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex rounded-full bg-[#bcead8] px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2d7561]">
                A New Path to Inner Peace
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#1f2827] md:text-7xl">
                {heroSlides[heroIndex].title}
                <br />
                <span className="italic text-[#2f745f]">
                  {heroSlides[heroIndex].highlight}
                </span>
              </h1>
              <p className="mt-6 max-w-[510px] text-[18px] leading-8 text-[#5d6664]">
                {heroSlides[heroIndex].description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-[#2f745f] px-8 py-4 text-sm font-semibold text-white shadow-md">
                  Talk to a Listener
                </button>
                <button className="rounded-full bg-[#e7dacd] px-8 py-4 text-sm font-semibold text-[#3e4a48]">
                  Take a Free Stress Test
                </button>
              </div>
              <div className="mt-7 flex gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === heroIndex
                        ? "w-10 bg-[#2f745f]"
                        : "w-2.5 bg-[#b8c4c1]"
                    }`}
                    aria-label={`Go to hero slide ${idx + 1}`}
                    onClick={() => setHeroIndex(idx)}
                  />
                ))}
              </div>
            </motion.div>
            <div className="relative h-[500px] overflow-hidden rounded-[40px] shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlides[heroIndex].visual}
                  className={`absolute inset-0 ${heroSlides[heroIndex].visual}`}
                  initial={{ opacity: 0.3, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.35, scale: 0.95 }}
                  transition={{ duration: 0.65 }}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-[#ececea] py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-[1240px] gap-6 px-6 md:grid-cols-2 md:px-10">
            {[
              {
                title: "Find Your Therapist",
                copy: "Professional psychological support tailored to your journey. Certified experts in emotional wellbeing and mental health.",
                action: "Begin Discovery",
              },
              {
                title: "Connect with a Listener",
                copy: "Sometimes, you just need to be heard. Connect with compassionate listeners for a safe, empathetic conversation anytime.",
                action: "Talk to Someone",
              },
            ].map((item) => (
              <motion.article
                key={item.title}
                className="rounded-[24px] bg-white p-7 shadow-[0_16px_32px_-28px_rgba(0,0,0,0.45)]"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="h-10 w-10 rounded-xl bg-[#bcead8]" />
                <h2 className="mt-6 text-[36px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                  {item.title}
                </h2>
                <p className="mt-3 max-w-[510px] text-[15px] leading-7 text-[#62706d]">
                  {item.copy}
                </p>
                <button className="mt-6 text-sm font-semibold text-[#2f745f]">
                  {item.action} →
                </button>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 text-center md:px-10">
            <h2 className="text-[48px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Listeners Online Now
            </h2>
            <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-[#bcead8]" />
            <div className="relative mt-10 overflow-hidden">
              <motion.div
                className="flex w-max gap-8"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 18, ease: "linear", repeat: Infinity }}
              >
                {marqueeListeners.map((name, idx) => (
                  <div
                    key={`${name}-${idx}`}
                    className="flex min-w-20 flex-col items-center gap-2"
                  >
                    <div className="relative h-16 w-16 rounded-full bg-[linear-gradient(150deg,#12171f,#555)] ring-2 ring-[#d9d9d9]">
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#32d17a]" />
                    </div>
                    <p className="text-sm font-semibold text-[#36403e]">
                      {name}
                    </p>
                  </div>
                ))}
              </motion.div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-[#f4f4f2] via-[#f4f4f2]/80 to-transparent backdrop-blur-[2px] md:w-28" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-[#f4f4f2] via-[#f4f4f2]/80 to-transparent backdrop-blur-[2px] md:w-28" />
            </div>
            <button className="mt-9 rounded-full bg-[#2f745f] px-10 py-4 text-sm font-semibold text-white">
              Book Now
            </button>
          </div>
        </motion.section>
        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[44px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                  Recommended Professionals
                </h2>
                <p className="text-[#687471]">
                  Highly-rated therapists matched to your profile.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous professionals"
                  className="grid h-10 w-10 place-content-center rounded-full border border-[#cfd4d2] text-[#55615e] transition hover:bg-white"
                >
                  ‹
                </button>
                <button
                  aria-label="Next professionals"
                  className="grid h-10 w-10 place-content-center rounded-full border border-[#cfd4d2] text-[#55615e] transition hover:bg-white"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                [
                  "Dr. Julianne Moore",
                  "Expert in anxiety management and mindfulness-based stress reduction.",
                  "$120/session",
                  "4.9",
                  "bg-[linear-gradient(120deg,#35a7bc,#2e7ca2)]",
                ],
                [
                  "Dr. Robert Chen",
                  "Specializing in relationship dynamics and systemic family emotional support.",
                  "$145/session",
                  "5.0",
                  "bg-[linear-gradient(120deg,#5ec5b8,#2796c1)]",
                ],
                [
                  "Dr. Aisha Williams",
                  "Passionate about healing developmental trauma through somatic experiencing.",
                  "$130/session",
                  "4.8",
                  "bg-[linear-gradient(120deg,#244961,#2f8db5)]",
                ],
              ].map(([name, bio, price, rating, color]) => (
                <motion.article
                  key={name}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-calm border border-[#dfdfdb] bg-white"
                >
                  <div className={`h-[138px] ${color} relative`}>
                    <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3f4a47]">
                      {name.toString().includes("Aisha")
                        ? "Trauma Care"
                        : name.toString().includes("Robert")
                          ? "Family Counseling"
                          : "Cognitive Therapy"}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[28px] font-semibold tracking-[-0.02em] text-[#273331]">
                        {name}
                      </h3>
                      <span className="text-sm font-semibold text-[#566260]">
                        ☆ {rating}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#707b79]">
                      {bio}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#384441]">
                        {price}
                      </p>
                      <button className="text-sm font-semibold text-[#2f745f] underline underline-offset-2">
                        Profile
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>
        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-[48px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Wellness Collectives
            </h2>
            <p className="mt-2 text-[#667572]">
              Join supportive communities based on shared journeys.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
              <article className="rounded-[26px] bg-[#bcead8] p-8">
                <h3 className="mt-44 text-4xl font-semibold tracking-[-0.02em] text-[#2f5248]">
                  Mindful Students Hub
                </h3>
                <p className="mt-3 max-w-sm text-[#4c6961]">
                  A safe space for university students navigating academic
                  pressure and early adulthood.
                </p>
                <button className="mt-6 rounded-full bg-[#2f745f] px-6 py-3 text-sm font-semibold text-white">
                  Join Group
                </button>
              </article>
              <article className="rounded-[26px] bg-[#e7dacd] p-8">
                <h3 className="text-3xl font-semibold tracking-[-0.02em] text-[#4d4339]">
                  Nature Walkers
                </h3>
                <p className="mt-4 text-[#74695f]">
                  Weekly morning therapeutic walks in city parks.
                </p>
              </article>
              <div className="grid gap-4">
                <article className="grid place-content-center rounded-[26px] bg-[#ececeb] p-8 text-center">
                  <p className="text-5xl font-bold text-[#2e3332]">12k+</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#7a7d7b]">
                    Members
                  </p>
                </article>
                <article className="grid place-content-center rounded-[26px] bg-[#bcead8] p-8 text-center">
                  <p className="text-5xl font-bold text-[#2e3332]">45+</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#61746f]">
                    Cities
                  </p>
                </article>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="events"
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto grid max-w-[1240px] gap-8 px-6 md:grid-cols-2 md:px-10">
            <article className="grid overflow-hidden rounded-[32px] bg-white shadow-[0_20px_42px_-35px_rgba(0,0,0,0.45)] md:grid-cols-[1fr_1.2fr]">
              <div className="min-h-[280px] bg-[radial-gradient(circle_at_20%_50%,#d6bb77,#1d120d_60%)]" />
              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#798682]">
                  Next Big Event • Dec 15
                </p>
                <h3 className="mt-2 text-[40px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                  Winter Equinox Mindfulness Retreat
                </h3>
                <p className="mt-4 text-[#63706d]">
                  A 3-hour digital immersion including guided breathwork, sound
                  healing, and community reflection sessions.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <button className="rounded-full bg-[#2f745f] px-6 py-3 text-sm font-semibold text-white">
                    Reserve Spot
                  </button>
                  <span className="text-xs font-semibold text-[#9ea5a3]">
                    Limited Seats
                  </span>
                </div>
              </div>
            </article>
            <article className="rounded-[32px] bg-white p-8 shadow-[0_20px_42px_-35px_rgba(0,0,0,0.45)]">
              <h3 className="text-[46px] font-semibold tracking-[-0.02em] text-[#1f2827]">
                Calendar
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  ["Dec 18", "Anxiety Workshop", "7:00 PM • Online Webinar"],
                  ["Jan 05", "Grief Support Circle", "6:30 PM • Group Zoom"],
                ].map(([date, title, meta]) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl bg-[#f7f7f5] p-4"
                  >
                    <div className="rounded-xl bg-[#bcead8] px-3 py-2 text-center">
                      <p className="text-xs font-semibold uppercase leading-tight text-[#2f745f]">
                        {date.split(" ")[0]}
                      </p>
                      <p className="text-xl font-bold text-[#2f745f]">
                        {date.split(" ")[1]}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1f2827]">{title}</p>
                      <p className="text-sm text-[#697572]">{meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Voices of The Sanctuary
            </h2>
            <div className="mt-8 grid max-h-[360px] gap-4 overflow-hidden md:grid-cols-3">
              {voiceColumns.map((column, columnIndex) => {
                const columnItems = [...column, ...column];
                const movePattern =
                  columnIndex === 1 ? ["-50%", "0%"] : ["0%", "-50%"];
                return (
                  <motion.div
                    key={columnIndex}
                    className="flex flex-col gap-4"
                    animate={{ y: movePattern }}
                    transition={{
                      duration: 14 + columnIndex * 2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    {columnItems.map((quote, index) => (
                      <article
                        key={`${quote}-${index}`}
                        className={`rounded-[18px] p-5 ${
                          columnIndex === 1 && index % 2 === 0
                            ? "bg-[#bcead8]"
                            : "bg-[#f0f0ed]"
                        }`}
                      >
                        <p className="text-sm italic text-[#5f6d6a]">{quote}</p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#2b3c39]">
                          User {columnIndex + 1}
                        </p>
                      </article>
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="text-center text-[52px] font-semibold tracking-[-0.02em] text-[#1f2827]">
              Gentle Answers
            </h2>
            <div className="mt-8 space-y-4">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.question}
                    className="rounded-2xl bg-white px-5 py-4 shadow-[0_16px_30px_-28px_rgba(0,0,0,0.5)]"
                  >
                    <button
                      className="flex w-full items-center justify-between gap-4 text-left text-sm font-semibold text-[#273331]"
                      onClick={() =>
                        setOpenFaqIndex((current) =>
                          current === idx ? -1 : idx,
                        )
                      }
                    >
                      <span>{item.question}</span>
                      <span
                        className={`text-xl leading-none transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden pt-3 text-sm text-[#6b7674]"
                        >
                          {item.answer}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-6 pb-16 md:px-10"
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mx-auto max-w-[1240px] rounded-[38px] bg-[#2f745f] p-10 md:p-14">
            <h2 className="text-[52px] font-semibold tracking-[-0.02em] text-white">
              Become a part of ApnaHealer
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [
                  "Be a Listener",
                  "Lend your heart and time to support others in need.",
                  "Apply Now",
                ],
                [
                  "Join as Therapist",
                  "Grow your clinical practice within our mindful ecosystem.",
                  "Register",
                ],
                [
                  "Organizations",
                  "Bring mental wellness to your team or institution.",
                  "Partner",
                ],
              ].map(([title, copy, action]) => (
                <motion.article
                  key={title}
                  className="rounded-2xl border border-white/20 bg-white/10 p-6"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm text-white/85">{copy}</p>
                  <button className="mt-5 rounded-full bg-[#d5e8df] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f745f]">
                    {action}
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
      <AnimatePresence>
        {isJoinModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[#f4f4f2]/45 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJoinModal}
          >
            <motion.div
              className="w-full max-w-[540px] rounded-[24px] border border-black/5 bg-white px-8 py-7 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-center text-[34px] font-semibold text-[#2f745f]">
                  ApnaHealer
                </p>
                <button
                  type="button"
                  aria-label="Close join modal"
                  onClick={closeJoinModal}
                  className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-[#9ca4a2] transition hover:bg-[#f4f4f2]"
                >
                  ×
                </button>
              </div>
              <h3 className="text-center text-[50px] font-semibold tracking-[-0.02em] text-[#26302e]">
                Continue your journey
              </h3>
              <p className="mx-auto mt-3 max-w-[390px] text-center text-[17px] leading-7 text-[#75817d]">
                Take a deep breath. We&apos;ve missed your presence in this
                space.
              </p>
              {modalMethod === "phone" ? (
                <form onSubmit={handlePhoneSubmit} className="mt-7 space-y-3">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Enter phone number"
                    className="h-[56px] w-full rounded-full border border-[#e4e6e5] bg-[#f8f8f7] px-5 text-[15px] text-[#2f3332] outline-none transition focus:border-[#2f745f]"
                  />
                  {!isOtpStage ? (
                    <button
                      type="submit"
                      className="h-[48px] w-full rounded-full bg-[#2f745f] text-[14px] font-semibold text-white transition hover:bg-[#245d4c]"
                    >
                      Submit phone number
                    </button>
                  ) : null}
                </form>
              ) : (
                <button
                  type="button"
                  className="mt-7 flex h-[56px] w-full items-center justify-center rounded-full bg-[#f3f3f1] text-[16px] font-semibold text-[#2f3332] transition hover:bg-[#ececea]"
                >
                  Sign in with Google
                </button>
              )}
              {modalMethod === "phone" && isOtpStage ? (
                <form onSubmit={handleOtpSubmit} className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    placeholder="Enter OTP"
                    className="h-[52px] w-full rounded-xl border border-[#e4e6e5] bg-white px-4 text-[15px] text-[#2f3332] outline-none transition focus:border-[#2f745f]"
                  />
                  <button
                    type="submit"
                    className="h-[46px] w-full rounded-full bg-[#2f745f] text-[14px] font-semibold text-white transition hover:bg-[#245d4c]"
                  >
                    Submit OTP
                  </button>
                </form>
              ) : null}
              <p className="mt-7 text-center text-[12px] font-semibold uppercase tracking-widest text-[#b1b6b4]">
                Other ways to enter
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMethod("email");
                    setPhoneNumber("");
                    setOtpCode("");
                    setIsOtpStage(false);
                  }}
                  className={`h-[52px] rounded-xl border text-[14px] font-semibold transition ${
                    modalMethod === "email"
                      ? "border-[#2f745f] bg-[#dff2ea] text-[#2f745f]"
                      : "border-transparent bg-[#f3f3f1] text-[#5d6664] hover:bg-[#ececea]"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMethod("phone");
                    setOtpCode("");
                    setIsOtpStage(false);
                  }}
                  className={`h-[52px] rounded-xl border text-[14px] font-semibold transition ${
                    modalMethod === "phone"
                      ? "border-[#2f745f] bg-[#dff2ea] text-[#2f745f]"
                      : "border-transparent bg-[#f3f3f1] text-[#5d6664] hover:bg-[#ececea]"
                  }`}
                >
                  Phone
                </button>
              </div>
              <p className="mt-6 text-center text-xs text-[#a1a8a6]">
                By entering, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
