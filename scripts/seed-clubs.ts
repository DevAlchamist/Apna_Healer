/**
 * Seed clubs from src/data/clubs.ts into the database.
 * Run: npx tsx scripts/seed-clubs.ts
 * Requires DATABASE_URL and an existing admin user (first ADMIN role user).
 */
import { ClubStatus, Role } from "@prisma/client";
import { clubDetails } from "../src/data/clubs";
import { prisma } from "../src/lib/prisma";
import { slugifyTitle, uniqueClubSlug } from "../src/server/services/club-utils";

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) {
    console.error("No admin user found. Create an admin user first.");
    process.exit(1);
  }

  for (const mock of clubDetails) {
    const exists = await prisma.club.findFirst({
      where: { OR: [{ slug: mock.id }, { title: mock.title }] },
    });
    if (exists) {
      console.log(`Skip existing: ${mock.title}`);
      continue;
    }

    const slug = await uniqueClubSlug(mock.title, async (s) => {
      const row = await prisma.club.findUnique({ where: { slug: s } });
      return row != null;
    });

    const club = await prisma.club.create({
      data: {
        slug: slug === slugifyTitle(mock.title) ? mock.id : slug,
        title: mock.title,
        subtitle: mock.subtitle,
        description: mock.subtitle,
        heroImageUrl: mock.heroImage,
        galleryUrls: [],
        monthlyFee: 299,
        status: ClubStatus.ACTIVE,
        visibility: "PUBLIC",
        createdByUserId: admin.id,
        ownerUserId: null,
        memberCount: 0,
      },
    });

    if (mock.reflections.length > 0) {
      await prisma.clubReview.createMany({
        data: mock.reflections.map((r, i) => ({
          clubId: club.id,
          authorLabel: r.by,
          quote: r.quote,
          sortOrder: i,
        })),
      });
    }

    console.log(`Created club: ${club.title} (${club.slug})`);
  }

  console.log("Done seeding clubs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
