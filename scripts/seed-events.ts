/**
 * Seed wellness events from src/data/events.ts.
 * Run: npx tsx scripts/seed-events.ts
 */
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

import { Role, EventStatus } from "@prisma/client";
import { eventDetails, featuredEvents } from "../src/data/events";

const SEED_EVENTS = [
  {
    slug: "somatic-breathwork",
    fromFeatured: featuredEvents.find((e) => e.id === "somatic-breathwork"),
    startsAt: new Date("2026-06-14T18:00:00Z"),
    capacity: 24,
    basePrice: 499,
    category: "Breathwork",
  },
  {
    slug: "mindful-resilience",
    detail: eventDetails.find((e) => e.id === "mindful-resilience"),
    startsAt: new Date("2026-10-15T09:00:00Z"),
    capacity: 30,
    basePrice: 60,
    memberPrice: 0,
    membersPay: false,
    category: "Workshop",
  },
  {
    slug: "sunset-sound-immersion",
    detail: eventDetails.find((e) => e.id === "sunset-sound-immersion"),
    startsAt: new Date("2026-10-24T18:30:00Z"),
    capacity: 20,
    basePrice: 45,
    category: "Healing Experience",
  },
  {
    slug: "creative-expression-grief",
    detail: eventDetails.find((e) => e.id === "creative-expression-grief"),
    startsAt: new Date("2026-10-17T14:00:00Z"),
    capacity: 16,
    basePrice: 40,
    guestPrice: 40,
    nonMembersPay: true,
    membersPay: false,
    category: "Workshop",
  },
] as const;

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) {
    console.error("No admin user found.");
    process.exit(1);
  }

  const clubs = await prisma.club.findMany({ take: 2, orderBy: { createdAt: "asc" } });

  for (let i = 0; i < SEED_EVENTS.length; i++) {
    const seed = SEED_EVENTS[i]!;
    const exists = await prisma.event.findUnique({ where: { slug: seed.slug } });
    if (exists) {
      console.log(`Skip existing: ${seed.slug}`);
      continue;
    }

    const featured = "fromFeatured" in seed ? seed.fromFeatured : null;
    const detail = "detail" in seed ? seed.detail : null;
    const title =
      detail?.title ?? featured?.title ?? seed.slug.replace(/-/g, " ");
    const subtitle = featured?.description ?? detail?.about[0] ?? null;
    const heroImageUrl = detail?.heroImage ?? featured?.image ?? null;
    const clubId = i < 2 && clubs[i] ? clubs[i]!.id : null;

    let categoryId: string | null = null;
    if (seed.category) {
      const cat = await prisma.eventCategory.upsert({
        where: { name: seed.category },
        update: {},
        create: { name: seed.category },
      });
      categoryId = cat.id;
    }

    await prisma.event.create({
      data: {
        slug: seed.slug,
        clubId,
        createdByUserId: admin.id,
        organizedByUserId: admin.id,
        title,
        subtitle,
        description: detail?.about.join("\n\n") ?? subtitle,
        categoryId,
        heroImageUrl,
        startsAt: seed.startsAt,
        venue: detail?.venue ?? "Apna Healer Studio",
        mode: "IN_PERSON",
        capacity: seed.capacity,
        seatsRemaining: seed.capacity,
        basePrice: seed.basePrice,
        memberPrice: "memberPrice" in seed ? seed.memberPrice : null,
        guestPrice: "guestPrice" in seed ? seed.guestPrice : null,
        membersPay: "membersPay" in seed ? seed.membersPay : true,
        nonMembersPay: "nonMembersPay" in seed ? seed.nonMembersPay : true,
        status: EventStatus.PUBLISHED,
        facilitatorName: detail?.facilitatorName ?? featured?.host ?? null,
        facilitatorRole: detail?.facilitatorRole ?? null,
        facilitatorImage: detail?.facilitatorImage ?? null,
        facilitatorBio: detail?.facilitatorBio ?? null,
      },
    });

    console.log(`Created event: ${title} (${seed.slug})${clubId ? ` → club ${clubs.find((c) => c.id === clubId)?.slug}` : ""}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
