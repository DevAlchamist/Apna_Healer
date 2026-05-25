export type EventSummary = {
  id: string;
  title: string;
  host: string;
  description: string;
  image: string;
  tag: string;
  likes: number;
};

export type EventDetail = {
  id: string;
  category: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  title: string;
  heroImage: string;
  about: string[];
  journeyPoints: string[];
  audienceText: string;
  price: string;
  seatsLeft: string;
  facilitatorName: string;
  facilitatorRole: string;
  facilitatorImage: string;
  facilitatorBio: string;
  reflections: Array<{
    quote: string;
    by: string;
    meta: string;
  }>;
};

export type DashboardSuggestedEvent = {
  id: string;
  title: string;
  image: string;
  dateBadge: string;
  /** e.g. "18:00 · Virtual Event" */
  metaLine: string;
};

/** Compact cards for the dashboard sidebar (below Recent activity). */
export const dashboardSuggestedEvents: DashboardSuggestedEvent[] = [
  {
    id: "mindful-resilience",
    title: "Mindful Resilience Workshop",
    image:
      "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=800&q=80&auto=format&fit=crop",
    dateBadge: "15 OCT",
    metaLine: "09:00 · Workshop",
  },
  {
    id: "sunset-sound-immersion",
    title: "Sunset Sound Immersion",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80&auto=format&fit=crop",
    dateBadge: "24 OCT",
    metaLine: "18:30 · Healing experience",
  },
  {
    id: "creative-expression-grief",
    title: "Creative Expression for Grief",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&auto=format&fit=crop",
    dateBadge: "17 OCT",
    metaLine: "14:00 · Small group",
  },
];

export const featuredEvents: EventSummary[] = [
  {
    id: "somatic-breathwork",
    title: "Deep Release: Somatic Breathwork",
    host: "Sarah Jenkins",
    description:
      "A guided journey through conscious breathing to unlock physical tension and emotional blocks.",
    image: "https://images.unsplash.com/photo-1514149358658-38dedeafd5f3?w=900&q=80&auto=format&fit=crop",
    tag: "TODAY · 18:00",
    likes: 12,
  },
  {
    id: "mindful-resilience",
    title: "Mindful Resilience Workshop",
    host: "Dr. Michael Chen",
    description: "Scientific tools combined with ancient practices to build cognitive strength and inner peace.",
    image: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=900&q=80&auto=format&fit=crop",
    tag: "OCT 15 · 09:00",
    likes: 45,
  },
  {
    id: "sunset-sound-immersion",
    title: "Sunset Sound Immersion",
    host: "Dr. Elena Thorne",
    description: "Tibetan bowls and deep-frequency gongs to guide your nervous system into profound relaxation.",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1400&q=80&auto=format&fit=crop",
    tag: "OCT 24 · 18:30",
    likes: 67,
  },
  {
    id: "creative-expression-grief",
    title: "Creative Expression for Grief",
    host: "Marcus Roe",
    description: "A safe space to process loss through gentle creative writing and visual expression.",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=80&auto=format&fit=crop",
    tag: "OCT 17 · 14:00",
    likes: 19,
  },
];

export const eventDetails: EventDetail[] = [
  {
    id: "mindful-resilience",
    category: "Workshop",
    dateLabel: "Tuesday, Oct 15, 2024",
    timeLabel: "9:00 AM - 11:30 AM",
    venue: "Studio Hall, Level 2",
    title: "Mindful Resilience Workshop",
    heroImage: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=1600&q=80&auto=format&fit=crop",
    about: [
      "This workshop blends practical neuroscience with mindfulness techniques to help you respond to pressure with clarity instead of overwhelm. You will learn how to notice stress early, regulate your nervous system, and recover faster after difficult moments.",
      "Through guided practices, reflection prompts, and partner exercises, you will build a personalized resilience toolkit that can be used at work, at home, and in emotionally demanding situations.",
    ],
    journeyPoints: [
      "Understanding stress loops and triggers",
      "Breath and grounding tools for rapid reset",
      "Building a sustainable daily resilience ritual",
    ],
    audienceText:
      "Ideal for professionals, caregivers, and students navigating high demands. No meditation background is needed; every practice is beginner-friendly and science-informed.",
    price: "$60",
    seatsLeft: "8 seats left",
    facilitatorName: "Dr. Michael Chen",
    facilitatorRole: "Clinical Psychologist & Mindfulness Educator",
    facilitatorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80&auto=format&fit=crop",
    facilitatorBio:
      "Dr. Chen has spent the last decade helping individuals and teams build emotional endurance through evidence-based mindfulness. His facilitation style is warm, practical, and deeply grounded in both research and lived experience.",
    reflections: [
      {
        quote:
          "I walked in burned out and walked out with actual tools I could use the same day. It felt practical, not abstract.",
        by: "Nisha R.",
        meta: "Attended in July",
      },
      {
        quote:
          "The balance of science and guided practice made this one of the most useful wellness workshops I've done.",
        by: "Daniel P.",
        meta: "Attended in June",
      },
    ],
  },
  {
    id: "sunset-sound-immersion",
    category: "Healing Experience",
    dateLabel: "Friday, Oct 24, 2024",
    timeLabel: "6:30 PM - 8:00 PM",
    venue: "The Atrium, Sky Lounge",
    title: "Sunset Sound Immersion",
    heroImage: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600&q=80&auto=format&fit=crop",
    about: [
      "Join us for an ethereal journey through sound as the sun dips below the horizon. This immersive experience utilizes Tibetan singing bowls, crystal harps, and deep-frequency gongs to guide your nervous system into a state of profound relaxation.",
      "You will be cradled in a restorative environment, allowing the harmonic resonances to wash over you, clearing energetic blockages and fostering a sense of deep inner peace.",
    ],
    journeyPoints: [
      "Guided breathwork opening",
      "45-minute harmonic sound bath",
      "Gentle awakening and grounding tea",
    ],
    audienceText:
      "Designed for anyone seeking a refuge from digital noise. No previous experience with meditation or sound therapy is required. Perfect for high-stress professionals and creative souls.",
    price: "$45",
    seatsLeft: "12 seats left",
    facilitatorName: "Dr. Elena Thorne",
    facilitatorRole: "Sound Alchemist & Clinical Psychologist",
    facilitatorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80&auto=format&fit=crop",
    facilitatorBio:
      "With over 15 years of experience in psychoacoustics and mindfulness, Dr. Thorne blends clinical rigor with ancient healing modalities. Her sessions are curated to bridge the gap between science and soul, providing a safe container for emotional release.",
    reflections: [
      {
        quote:
          "The sound immersion was like a reset button for my soul. I arrived feeling fragmented and left feeling whole. Elena's presence is truly healing.",
        by: "Marcus W.",
        meta: "Attended in September",
      },
      {
        quote:
          "I've never slept better than the night after this session. The crystal bowls created a vibration that I could feel in my very bones.",
        by: "Sarah K.",
        meta: "Attended in August",
      },
    ],
  },
  {
    id: "creative-expression-grief",
    category: "Workshop",
    dateLabel: "Thursday, Oct 17, 2024",
    timeLabel: "2:00 PM - 4:00 PM",
    venue: "Garden Studio",
    title: "Creative Expression for Grief",
    heroImage:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1600&q=80&auto=format&fit=crop",
    about: [
      "A gentle, guided space to explore loss through writing and simple visual exercises. There is no pressure to share more than you wish; the focus is on presence and self-compassion.",
      "You will be invited to work at your own pace with optional prompts, soft music, and breaks as needed.",
    ],
    journeyPoints: ["Opening circle and grounding", "Guided creative prompts", "Closing reflection"],
    audienceText:
      "Open to anyone navigating grief or transition. No art experience is required; materials are provided.",
    price: "$40",
    seatsLeft: "10 seats left",
    facilitatorName: "Marcus Roe",
    facilitatorRole: "Expressive Arts Facilitator",
    facilitatorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80&auto=format&fit=crop",
    facilitatorBio:
      "Marcus supports people in processing difficult emotions through creative ritual and narrative work.",
    reflections: [
      {
        quote: "I left feeling lighter, like I had finally put a piece of my story down on paper.",
        by: "Anonymous",
        meta: "Attended in October",
      },
    ],
  },
];
