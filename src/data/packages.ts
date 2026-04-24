export type WellnessPackage = {
  id: string;
  title: string;
  sessions: string;
  description: string;
  image: string;
  currentPrice: string;
  originalPrice?: string;
  badge?: string;
  ctaLabel: string;
};

export type WellnessPackageDetail = {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
  sessions: string;
  duration: string;
  category: string;
  currentPrice: string;
  originalPrice?: string;
  summary: string[];
  includes: string[];
  idealFor: string[];
  facilitatorNote: string;
};

export const wellnessPackages: WellnessPackage[] = [
  {
    id: "mindfulness-starter-pack",
    title: "Mindfulness Starter Pack",
    sessions: "5 Sessions",
    description: "Begin your journey into present-moment awareness with guided breathwork and focus sessions.",
    image:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&q=80&auto=format&fit=crop",
    currentPrice: "$382.50",
    originalPrice: "$450.00",
    badge: "15% Off",
    ctaLabel: "View Bundle",
  },
  {
    id: "deep-healing-journey",
    title: "Deep Healing Journey",
    sessions: "10 Sessions",
    description: "An immersive experience for those seeking profound emotional release and trauma-informed recovery practices.",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80&auto=format&fit=crop",
    currentPrice: "$675.00",
    originalPrice: "$900.00",
    badge: "Most Popular · 25% Off",
    ctaLabel: "View Bundle",
  },
  {
    id: "self-care-essentials",
    title: "Self-Care Essentials",
    sessions: "3 Sessions",
    description: "Maintenance for the busy mind. A flexible three-session bundle for consistent mental health hygiene.",
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&q=80&auto=format&fit=crop",
    currentPrice: "$280.00",
    ctaLabel: "View Bundle",
  },
];

export const wellnessPackageDetails: WellnessPackageDetail[] = [
  {
    id: "mindfulness-starter-pack",
    title: "Mindfulness Starter Pack",
    subtitle: "A gentle beginning for emotional steadiness and daily calm.",
    heroImage:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=1600&q=80&auto=format&fit=crop",
    sessions: "5 Sessions",
    duration: "4 weeks",
    category: "Foundational",
    currentPrice: "$382.50",
    originalPrice: "$450.00",
    summary: [
      "This package is designed for people who are new to structured emotional wellness support. You will establish basic grounding skills and a sustainable breath-led routine.",
      "Each session builds progressively so you can practice calm focus, regulate anxious spikes, and cultivate a stronger relationship with your thoughts.",
    ],
    includes: [
      "2 guided breathwork sessions",
      "2 mindfulness coaching calls",
      "1 integration and habit-building review",
      "Daily 10-minute audio prompts",
    ],
    idealFor: ["Early stress signals", "Routine building", "Mindfulness beginners"],
    facilitatorNote: "Consistency matters more than intensity. Small daily practices create real emotional change.",
  },
  {
    id: "deep-healing-journey",
    title: "Deep Healing Journey",
    subtitle: "An intensive path for deep emotional release and resilience.",
    heroImage:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&auto=format&fit=crop",
    sessions: "10 Sessions",
    duration: "8-10 weeks",
    category: "Transformational",
    currentPrice: "$675.00",
    originalPrice: "$900.00",
    summary: [
      "This curated journey is for those ready to address persistent emotional loops and long-standing nervous system patterns with close therapeutic support.",
      "The program combines somatic grounding, guided processing, and practical after-care routines for meaningful long-term change.",
    ],
    includes: [
      "6 deep therapy sessions",
      "2 somatic regulation sessions",
      "1 relational patterns workshop",
      "1 integration and future-care plan",
    ],
    idealFor: ["Chronic stress", "Emotional burnout", "Trauma-informed recovery"],
    facilitatorNote: "Healing is non-linear. This package gives space for depth while keeping you anchored and supported.",
  },
  {
    id: "self-care-essentials",
    title: "Self-Care Essentials",
    subtitle: "Short, effective maintenance for your emotional wellbeing.",
    heroImage:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&q=80&auto=format&fit=crop",
    sessions: "3 Sessions",
    duration: "3 weeks",
    category: "Maintenance",
    currentPrice: "$280.00",
    summary: [
      "Built for busy schedules, this package helps you reset your emotional baseline without committing to a longer program.",
      "You will learn rapid calming tools and receive targeted support for current stressors.",
    ],
    includes: [
      "2 focused support sessions",
      "1 progress and reset session",
      "Personalized weekly self-care checklist",
    ],
    idealFor: ["Busy professionals", "Preventive self-care", "Short-term support"],
    facilitatorNote: "Think of this as emotional hygiene: small, intentional check-ins that keep you balanced.",
  },
];
