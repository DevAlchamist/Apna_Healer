export type ClubDetail = {
  id: string;
  title: string;
  subtitle: string;
  heroImage: string;
  activeMembers: string;
  weeklyEvents: string;
  upcomingCircles: Array<{
    date: string;
    month: string;
    mode: string;
    title: string;
    time: string;
    meta: string;
  }>;
  residentHealers: Array<{
    name: string;
    role: string;
    image: string;
  }>;
  reflections: Array<{
    by: string;
    ago: string;
    quote: string;
    likes: number;
    replies: number;
  }>;
};

export const clubDetails: ClubDetail[] = [
  {
    id: "morning-meditators",
    title: "The Breath Collective",
    subtitle:
      "A sanctuary for conscious breathing, somatic exploration, and collective stillness. Join us for weekly guided journeys and member-led circles.",
    heroImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "1.2k",
    weeklyEvents: "24",
    upcomingCircles: [
      { date: "24", month: "OCT", mode: "Virtual", title: "Pranayama for Deep Sleep", time: "19:00 PM", meta: "45 Attending" },
      { date: "28", month: "OCT", mode: "Studio", title: "Elemental Breath Workshop", time: "10:30 AM", meta: "12 Remaining" },
    ],
    residentHealers: [
      {
        name: "Dr. Aris Thorne",
        role: "Somatic Specialist",
        image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=240&q=80&auto=format&fit=crop",
      },
      {
        name: "Elena Mist",
        role: "Breathwork Coach",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80&auto=format&fit=crop",
      },
      {
        name: "Julian Sol",
        role: "Zen Practitioner",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&q=80&auto=format&fit=crop",
      },
    ],
    reflections: [
      {
        by: "Sarah K.",
        ago: "2h ago",
        quote: "The morning awaken session was exactly the grounding I needed before this hectic week. Truly grateful for this collective.",
        likes: 12,
        replies: 3,
      },
      {
        by: "Marcus Chen",
        ago: "5h ago",
        quote: "Finally mastered the box breathing technique thanks to Dr. Thorne's guidance. The clarity is insane.",
        likes: 24,
        replies: 4,
      },
      {
        by: "Leila V.",
        ago: "Yesterday",
        quote: "Joined my first circle today. A bit nervous but the energy was so welcoming. I'm coming back for the full workshop on Sunday!",
        likes: 8,
        replies: 1,
      },
    ],
  },
  {
    id: "grief-and-grace",
    title: "Grief & Grace",
    subtitle:
      "A compassionate space for honoring loss and rebuilding tenderness. Weekly circles support every stage of grief with care and community.",
    heroImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "678",
    weeklyEvents: "9",
    upcomingCircles: [
      { date: "26", month: "OCT", mode: "Virtual", title: "Holding Memory with Compassion", time: "18:00 PM", meta: "33 Attending" },
      { date: "31", month: "OCT", mode: "Studio", title: "Rituals for Anniversaries", time: "07:30 PM", meta: "8 Remaining" },
    ],
    residentHealers: [
      {
        name: "Nora Dev",
        role: "Grief Counselor",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&q=80&auto=format&fit=crop",
      },
      {
        name: "Priya Sen",
        role: "Trauma-informed Guide",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&q=80&auto=format&fit=crop",
      },
      {
        name: "Aman Noor",
        role: "Mindfulness Facilitator",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80&auto=format&fit=crop",
      },
    ],
    reflections: [
      {
        by: "Devika M.",
        ago: "1d ago",
        quote: "I finally felt seen without needing to explain everything. This club has become my anchor.",
        likes: 15,
        replies: 2,
      },
      {
        by: "Rohit S.",
        ago: "2d ago",
        quote: "The gentle prompts and shared stories helped me process what I've been avoiding for months.",
        likes: 9,
        replies: 1,
      },
      {
        by: "Anya L.",
        ago: "3d ago",
        quote: "Thank you for creating a place where grief is met with softness instead of advice.",
        likes: 14,
        replies: 3,
      },
    ],
  },
  {
    id: "breathwork-basics",
    title: "Breathwork Basics",
    subtitle: "Guided breathing patterns to calm the nervous system and restore balance, one inhale at a time.",
    heroImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "842",
    weeklyEvents: "11",
    upcomingCircles: [
      { date: "29", month: "OCT", mode: "Virtual", title: "Beginners Box Breathing", time: "07:00 AM", meta: "22 Attending" },
      { date: "03", month: "NOV", mode: "Studio", title: "Nervous System Reset", time: "06:30 PM", meta: "9 Remaining" },
    ],
    residentHealers: [
      { name: "Tara N.", role: "Breath Coach", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=240&q=80&auto=format&fit=crop" },
      { name: "Rohan K.", role: "Somatic Guide", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80&auto=format&fit=crop" },
      { name: "Mei A.", role: "Mindfulness Mentor", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Nikhil", ago: "4h ago", quote: "Simple and practical. I can finally use breathwork during stressful meetings.", likes: 7, replies: 1 },
      { by: "Aarohi", ago: "Yesterday", quote: "The weekly check-ins keep me consistent.", likes: 11, replies: 2 },
      { by: "Sam", ago: "2d ago", quote: "Breathing feels less intimidating now.", likes: 6, replies: 1 },
    ],
  },
  {
    id: "quiet-minds-circle",
    title: "Quiet Minds Circle",
    subtitle: "A gentle space for anxious thoughts, grounding exercises, and steady company.",
    heroImage: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "1.2k",
    weeklyEvents: "16",
    upcomingCircles: [
      { date: "30", month: "OCT", mode: "Virtual", title: "Evening Calm Session", time: "08:00 PM", meta: "56 Attending" },
      { date: "05", month: "NOV", mode: "Studio", title: "Grounding Through Body Scan", time: "05:00 PM", meta: "14 Remaining" },
    ],
    residentHealers: [
      { name: "Ira S.", role: "Anxiety Counselor", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=240&q=80&auto=format&fit=crop" },
      { name: "Jay P.", role: "CBT Facilitator", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80&auto=format&fit=crop" },
      { name: "Lina V.", role: "Breath Mentor", image: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Reva", ago: "2h ago", quote: "The group check-ins helped me feel less alone in panic episodes.", likes: 18, replies: 3 },
      { by: "Karan", ago: "1d ago", quote: "Learned grounding tools that actually work in real life.", likes: 10, replies: 2 },
      { by: "Mina", ago: "2d ago", quote: "Kind, gentle, and deeply supportive.", likes: 9, replies: 1 },
    ],
  },
  {
    id: "walks-in-stillness",
    title: "Walks in Stillness",
    subtitle: "Nature-inspired reflections and seasonal rituals to reconnect with yourself outdoors.",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "391",
    weeklyEvents: "6",
    upcomingCircles: [
      { date: "01", month: "NOV", mode: "Outdoor", title: "Silent Park Walk", time: "06:30 AM", meta: "18 Attending" },
      { date: "09", month: "NOV", mode: "Virtual", title: "Nature Journaling Circle", time: "07:30 PM", meta: "20 Attending" },
    ],
    residentHealers: [
      { name: "Ayla M.", role: "Nature Therapist", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=240&q=80&auto=format&fit=crop" },
      { name: "Ravi D.", role: "Meditation Guide", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=240&q=80&auto=format&fit=crop" },
      { name: "Nora K.", role: "Journaling Mentor", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Ishita", ago: "5h ago", quote: "Walking in silence with others is unexpectedly healing.", likes: 5, replies: 1 },
      { by: "Dev", ago: "1d ago", quote: "Best way to reset after a hard week.", likes: 7, replies: 2 },
      { by: "Arun", ago: "3d ago", quote: "The seasonal prompts are beautiful.", likes: 4, replies: 0 },
    ],
  },
  {
    id: "ink-and-insight",
    title: "Ink & Insight",
    subtitle: "Creative journaling and expressive arts to process emotions through story and symbolism.",
    heroImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "560",
    weeklyEvents: "13",
    upcomingCircles: [
      { date: "02", month: "NOV", mode: "Virtual", title: "Letters to Self", time: "09:00 PM", meta: "29 Attending" },
      { date: "08", month: "NOV", mode: "Studio", title: "Color and Emotion Mapping", time: "04:00 PM", meta: "10 Remaining" },
    ],
    residentHealers: [
      { name: "Maya R.", role: "Art Therapist", image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240&q=80&auto=format&fit=crop" },
      { name: "Pooja A.", role: "Writing Coach", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=240&q=80&auto=format&fit=crop" },
      { name: "Imran H.", role: "Trauma Guide", image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Sana", ago: "6h ago", quote: "Writing prompts helped me express what I couldn't say aloud.", likes: 13, replies: 2 },
      { by: "Rhea", ago: "1d ago", quote: "The art circles feel safe and freeing.", likes: 8, replies: 1 },
      { by: "Kabir", ago: "3d ago", quote: "A beautiful blend of creativity and healing.", likes: 6, replies: 1 },
    ],
  },
  {
    id: "dawn-rituals",
    title: "Dawn Rituals",
    subtitle: "Small accountability pods for movement, intention, and a softer start each morning.",
    heroImage: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "210",
    weeklyEvents: "7",
    upcomingCircles: [
      { date: "31", month: "OCT", mode: "Virtual", title: "Sunrise Intention Circle", time: "06:00 AM", meta: "16 Attending" },
      { date: "06", month: "NOV", mode: "Virtual", title: "Morning Movement Flow", time: "06:30 AM", meta: "19 Attending" },
    ],
    residentHealers: [
      { name: "Reet S.", role: "Routine Coach", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=240&q=80&auto=format&fit=crop" },
      { name: "Anvi P.", role: "Yoga Guide", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&q=80&auto=format&fit=crop" },
      { name: "Neel T.", role: "Wellness Mentor", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Mili", ago: "3h ago", quote: "This club helped me become a morning person.", likes: 9, replies: 2 },
      { by: "Ash", ago: "2d ago", quote: "Small rituals made a big difference in my mood.", likes: 7, replies: 1 },
      { by: "Rutu", ago: "4d ago", quote: "Accountability with kindness is the key.", likes: 4, replies: 0 },
    ],
  },
  {
    id: "holding-space",
    title: "Holding Space",
    subtitle: "For anyone carrying grief, uncertainty, or emotional fatigue. A circle of witness and care.",
    heroImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1800&q=80&auto=format&fit=crop",
    activeMembers: "678",
    weeklyEvents: "10",
    upcomingCircles: [
      { date: "04", month: "NOV", mode: "Virtual", title: "Gentle Sharing Circle", time: "07:00 PM", meta: "27 Attending" },
      { date: "10", month: "NOV", mode: "Studio", title: "Compassion Practices", time: "05:30 PM", meta: "11 Remaining" },
    ],
    residentHealers: [
      { name: "Sia M.", role: "Grief Therapist", image: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=240&q=80&auto=format&fit=crop" },
      { name: "Harsh J.", role: "Mindfulness Coach", image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=240&q=80&auto=format&fit=crop" },
      { name: "Nadia Q.", role: "Somatic Practitioner", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&q=80&auto=format&fit=crop" },
    ],
    reflections: [
      { by: "Tina", ago: "9h ago", quote: "This place reminds me that healing doesn't need to be rushed.", likes: 10, replies: 2 },
      { by: "Jay", ago: "1d ago", quote: "I appreciate the non-judgmental space.", likes: 8, replies: 1 },
      { by: "Om", ago: "2d ago", quote: "Supportive community with grounded facilitators.", likes: 6, replies: 1 },
    ],
  },
];

