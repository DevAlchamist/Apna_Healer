import { prisma } from "@/lib/prisma";

export async function hasEmailBeenSent(kind: string, dedupeKey: string): Promise<boolean> {
  const row = await prisma.emailDeliveryLog.findUnique({
    where: { kind_dedupeKey: { kind, dedupeKey } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function recordEmailDelivery(input: {
  userId: string;
  kind: string;
  dedupeKey: string;
}): Promise<void> {
  try {
    await prisma.emailDeliveryLog.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        dedupeKey: input.dedupeKey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unique constraint")) return;
    throw error;
  }
}
