import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const adapter = new PrismaPg({
  connectionString,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function hasProfessionalApplicationDelegate(client: PrismaClient) {
  return typeof (client as unknown as { professionalApplication?: { findFirst?: unknown } }).professionalApplication
    ?.findFirst === "function";
}

function hasDailyQuoteDelegate(client: PrismaClient) {
  return typeof (client as unknown as { dailyQuote?: { findMany?: unknown } }).dailyQuote?.findMany === "function";
}

function hasWellnessEventDelegate(client: PrismaClient) {
  return typeof (client as unknown as { wellnessEvent?: { findMany?: unknown } }).wellnessEvent
    ?.findMany === "function";
}

/** True when `prisma generate` was run for the current `User` model (member profile columns). */
function generatedClientHasUserProfileColumns() {
  return "bio" in Prisma.UserScalarFieldEnum;
}

function prismaClientMatchesCurrentSchema(client: PrismaClient) {
  return (
    hasProfessionalApplicationDelegate(client) &&
    hasDailyQuoteDelegate(client) &&
    hasWellnessEventDelegate(client) &&
    generatedClientHasUserProfileColumns()
  );
}

let prismaInstance = globalForPrisma.prisma ?? createPrismaClient();

if (!prismaClientMatchesCurrentSchema(prismaInstance)) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Prisma Client is out of date. Run `npx prisma generate` before `next start`.",
    );
  }

  void prismaInstance.$disconnect().catch(() => {});
  prismaInstance = createPrismaClient();
  globalForPrisma.prisma = prismaInstance;
}

if (!prismaClientMatchesCurrentSchema(prismaInstance)) {
  throw new Error(
    "Prisma Client is out of sync with prisma/schema.prisma. Run `npx prisma generate`, then restart `next dev` (cached Prisma instances can hide updates until restart).",
  );
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
