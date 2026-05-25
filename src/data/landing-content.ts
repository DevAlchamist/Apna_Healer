export type LandingFaqItem = {
  question: string;
  answer: string;
};

export const landingFaq: LandingFaqItem[] = [
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
];

export const landingTestimonials: string[][] = [
  [
    "The ability to find a listener at 2 AM when anxiety was peaking saved my week.",
    "The matching process actually works. My therapist understands my cultural background deeply.",
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
];
