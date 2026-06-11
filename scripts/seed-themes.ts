import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import { ALL_THEME_ROLES, getDefaultThemeTokensForRole } from "../src/config/theme-defaults";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed role themes.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const role of ALL_THEME_ROLES) {
    const tokens = getDefaultThemeTokensForRole(role);
    await prisma.roleTheme.upsert({
      where: { role },
      create: {
        role,
        tokens,
        version: 1,
        isCustomized: false,
      },
      update: {},
    });
    console.log(`Seeded theme for ${role}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
