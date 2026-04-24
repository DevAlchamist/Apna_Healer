export type TherapistMood = "All" | "Calm" | "Focused" | "Anxious";
export type TherapistSpecialization = "All" | "CBT" | "Trauma" | "Mindfulness";

export type TherapistRecord = {
  id: string;
  name: string;
  role: string;
  rating: string;
  fee: string;
  tags: string[];
  mood: TherapistMood;
  specialization: TherapistSpecialization;
  image: string;
  yearsExperience: number;
  sessions: string;
  about: string;
  focusAreas: string[];
  reviews: { quote: string; by: string }[];
};

export const moodFilters: TherapistMood[] = ["All", "Calm", "Focused", "Anxious"];
export const specializationFilters: TherapistSpecialization[] = ["All", "CBT", "Trauma", "Mindfulness"];

export const therapists: TherapistRecord[] = [
  {
    id: "elena-vance",
    name: "Dr. Elena Vance",
    role: "Clinical Psychologist, PhD",
    rating: "4.9",
    fee: "1,500",
    tags: ["CBT", "Trauma"],
    mood: "Calm",
    specialization: "Trauma",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 12,
    sessions: "850+",
    about:
      "Dr. Elena Vance specializes in cognitive behavioral therapy and trauma-informed care. Her sessions blend structure with warmth, helping clients build practical skills while feeling deeply heard.",
    focusAreas: ["Post-Traumatic Stress", "Anxiety Disorders", "Couples Counseling", "Mindfulness Based CBT"],
    reviews: [
      {
        quote: "Elena helped me navigate a season of panic with grace. Her sessions feel like coming home to oneself.",
        by: "Sarah M., Creative Director",
      },
      {
        quote: "The most grounded and empathetic therapist I have worked with. Every session gives me tools I can use.",
        by: "James L., Software Architect",
      },
    ],
  },
  {
    id: "marcus-thorne",
    name: "Marcus Thorne",
    role: "Mental Health Counselor",
    rating: "4.8",
    fee: "1,200",
    tags: ["Anxiety", "Relationships"],
    mood: "Anxious",
    specialization: "CBT",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 8,
    sessions: "600+",
    about: "Marcus supports clients through anxiety cycles and relational strain with compassionate structure.",
    focusAreas: ["Generalized Anxiety", "Relationship Stress", "Panic Management", "Boundary Setting"],
    reviews: [],
  },
  {
    id: "sarah-jenkins",
    name: "Dr. Sarah Jenkins",
    role: "Child Psychologist",
    rating: "4.9",
    fee: "2,000",
    tags: ["ADHD", "Family"],
    mood: "Focused",
    specialization: "CBT",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 10,
    sessions: "780+",
    about: "Sarah works with children and families to build emotional regulation and communication skills.",
    focusAreas: ["Child Anxiety", "ADHD Coaching", "Parent Guidance", "Family Systems"],
    reviews: [],
  },
  {
    id: "aria-noelle",
    name: "Aria Noelle",
    role: "Mindfulness Expert",
    rating: "4.7",
    fee: "1,500",
    tags: ["Meditation", "Stress"],
    mood: "Calm",
    specialization: "Mindfulness",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 7,
    sessions: "520+",
    about: "Aria integrates breathwork and somatic grounding for sustainable emotional balance.",
    focusAreas: ["Stress Recovery", "Meditation", "Somatic Tools", "Mindful Routines"],
    reviews: [],
  },
  {
    id: "james-wilson",
    name: "Dr. James Wilson",
    role: "Psychoanalyst",
    rating: "4.9",
    fee: "2,200",
    tags: ["Analysis", "Grief"],
    mood: "Focused",
    specialization: "Trauma",
    image: "https://images.unsplash.com/photo-1614436163996-25cee5f54290?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 14,
    sessions: "1.1k+",
    about: "James helps clients process grief and identity transitions through depth-oriented practice.",
    focusAreas: ["Grief", "Identity", "Life Transitions", "Depth Therapy"],
    reviews: [],
  },
  {
    id: "maya-rao",
    name: "Maya Rao",
    role: "Holistic Therapist",
    rating: "4.8",
    fee: "1,000",
    tags: ["Burnout", "Sleep"],
    mood: "Calm",
    specialization: "Mindfulness",
    image: "https://images.unsplash.com/photo-1651008376607-41c8f6cb5f95?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 6,
    sessions: "470+",
    about: "Maya specializes in burnout recovery through restorative habit systems and nervous-system care.",
    focusAreas: ["Burnout", "Sleep Hygiene", "Work Stress", "Self-Compassion"],
    reviews: [],
  },
  {
    id: "arjun-gupta",
    name: "Dr. Arjun Gupta",
    role: "Therapeutic Arts Practitioner",
    rating: "4.9",
    fee: "1,800",
    tags: ["Art Therapy", "PTSD"],
    mood: "Focused",
    specialization: "Trauma",
    image: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 9,
    sessions: "640+",
    about: "Arjun combines evidence-based trauma care with expressive techniques for resilient healing.",
    focusAreas: ["PTSD", "Expressive Arts", "Emotional Regulation", "Grounding Work"],
    reviews: [],
  },
  {
    id: "clara-zheng",
    name: "Clara Zheng",
    role: "CBT Specialist",
    rating: "4.8",
    fee: "1,600",
    tags: ["Behavioral", "Depression"],
    mood: "Anxious",
    specialization: "CBT",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=900&q=80&auto=format&fit=crop",
    yearsExperience: 11,
    sessions: "820+",
    about: "Clara focuses on behavior change plans that reduce depressive spirals and build daily momentum.",
    focusAreas: ["Depression", "Behavioral Activation", "Habit Coaching", "Resilience Building"],
    reviews: [],
  },
];
