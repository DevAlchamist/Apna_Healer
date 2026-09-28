export type LandingFaqItem = {
  question: string;
  answer: string;
};

export const landingFaq: LandingFaqItem[] = [
  {
    question: "⁠What is Apna Healer, and how can it support me?",
    answer:
      "Apna Healer is a safe, judgment-free space. You can instantly connect with an empathetic listener to talk things out, or begin a structured healing journey with licensed experts—entirely at your convenience.",
  },
  {
    question: "How does your matchmaking process work?",
    answer:
      "Our matchmaking system takes the guesswork out of finding help. It starts with you answering a few quick questions. Based on your responses, we recommend a listener, therapist, or expert. We then personalize your match—connecting you with a listener based on your emotions, or a professional based on your concern, language, and budget.",
  },
  {
    question: "How do I know if I need a therapist or a listener?",
    answer:
      "If you just need to vent, feel heard, or discuss current stress without receiving advice, a Listener is the best fit. If you need help managing deep-rooted issues, anxiety, or depression, and require structured professional guidance, you should choose a Therapist.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Absolutely. Your privacy is our top priority. You can be part of the community and receive support completely anonymously, without ever sharing your real identity or personal details.",
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
