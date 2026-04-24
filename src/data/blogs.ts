export type BlogSummary = {
  id: string;
  title: string;
  tag: string;
  date: string;
  excerpt: string;
  views: string;
  likes: string;
  comments: string;
  coverImage: string;
};

export type BlogDetail = {
  id: string;
  title: string;
  tag: string;
  publishedAt: string;
  views: string;
  likes: string;
  comments: string;
  heroImage: string;
  intro: string;
  sectionTitle: string;
  sectionBody: string;
  quote: string;
  quoteBy: string;
  paragraph: string;
  rituals: string[];
  sideImage: string;
};

export const publishedBlogs: BlogSummary[] = [
  {
    id: "art-of-silent-mornings",
    title: "The Art of Silent Mornings",
    tag: "Mindfulness",
    date: "Published Oct 24, 2024",
    excerpt:
      "Finding stillness in a world that never stops moving isn't a luxury; it's a necessity for spiritual maintenance...",
    views: "1.2k",
    likes: "245",
    comments: "18",
    coverImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "forest-bathing-cortisol-connection",
    title: "Forest Bathing and the Cortisol Connection",
    tag: "Nature",
    date: "Published Oct 12, 2024",
    excerpt:
      "Science is finally catching up with what our ancestors knew: the woods heal us in ways a laboratory cannot...",
    views: "892",
    likes: "112",
    comments: "9",
    coverImage:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&q=80&auto=format&fit=crop",
  },
];

export const blogDetails: BlogDetail[] = [
  {
    id: "art-of-silent-mornings",
    title: "The Art of Silent Mornings",
    tag: "Mindfulness",
    publishedAt: "Published Oct 24, 2023",
    views: "1.2k",
    likes: "245",
    comments: "18",
    heroImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80&auto=format&fit=crop",
    intro:
      "There is a particular kind of magic that exists in the world before the rest of the neighborhood wakes. It is a blue-tinted stillness where the shadows are long and the air feels new.",
    sectionTitle: "The Weight of Sound",
    sectionBody:
      "Our modern lives are defined by acoustic clutter. From the digital chirp of notifications to the hum of the refrigerator, we are rarely truly in silence. In my journey, I discovered that the first twenty minutes of the day are the most vulnerable and the most powerful for setting our emotional baseline.",
    quote: "Silence is not the absence of something, but the presence of everything.",
    quoteBy: "Wisdom of the Hearth",
    paragraph:
      "Practicing a silent morning does not mean you need to meditate for an hour. It means choosing one ritual and doing it without podcasts, television, or notifications. You are giving yourself permission to exist before you begin producing.",
    rituals: [
      "Digital fasting until breakfast",
      "Hand-written gratitude journaling",
      "Single-tasking your morning brew",
    ],
    sideImage:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "forest-bathing-cortisol-connection",
    title: "Forest Bathing and the Cortisol Connection",
    tag: "Nature",
    publishedAt: "Published Oct 12, 2023",
    views: "892",
    likes: "112",
    comments: "9",
    heroImage:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1800&q=80&auto=format&fit=crop",
    intro:
      "Science is finally catching up with what our ancestors knew. Time in nature softens our internal pace and gives the nervous system a chance to reset.",
    sectionTitle: "The Nervous System Reset",
    sectionBody:
      "Forest bathing is less about exercise and more about sensory presence. Slower breathing, softer gaze, and reduced cognitive noise create the ideal conditions for restoration.",
    quote: "Healing begins where urgency ends.",
    quoteBy: "Field Notes",
    paragraph:
      "You do not need a deep forest to begin. Start with one tree-lined lane, one park bench, one ten-minute walk with your phone on airplane mode.",
    rituals: [
      "Walk without a destination",
      "Observe five natural textures",
      "Close with three deep breaths",
    ],
    sideImage:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80&auto=format&fit=crop",
  },
];
