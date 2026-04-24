export type SafeCirclePost = {
  slug: string;
  author: string;
  time: string;
  circle: string;
  title: string;
  body: string;
  support: number;
  relate: number;
  image?: string;
};

export const safeCirclePosts: SafeCirclePost[] = [
  {
    slug: "finding-stillness-in-the-morning-rush",
    author: "Elena Vance",
    time: "4 hours ago",
    circle: "MENTAL WELLNESS",
    title: "Finding stillness in the morning rush",
    body: "For the longest time, my mornings were a battlefield of notifications, cold coffee, and the phantom weight of unread emails. I thought productivity meant moving as fast as possible the moment my eyes opened.",
    support: 24,
    relate: 12,
    image:
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&q=80&auto=format&fit=crop",
  },
  {
    slug: "the-beauty-of-saying-no",
    author: "Elena G.",
    time: "5 hours ago",
    circle: "DAILY THOUGHTS",
    title: 'The beauty of saying "no" to things that drain you',
    body: "Today I practiced a boundary. It felt uncomfortable at first, but then the relief washed over me. Boundary setting is a form of self-love I'm finally learning.",
    support: 41,
    relate: 18,
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80&auto=format&fit=crop",
  },
];
