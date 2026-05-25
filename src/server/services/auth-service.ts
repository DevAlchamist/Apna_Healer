import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { grantWelcomeBonusIfNeeded } from "@/server/services/welcome-bonus-service";

function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Promotes any user whose email matches `ADMIN_EMAILS` (comma-separated env
 * var) to the ADMIN role on every login. This avoids needing to hand-edit
 * the database after first sign-in via Google.
 */
export function shouldPromoteToAdmin(
  email: string | null | undefined,
  currentRole: Role | null | undefined,
  adminEmailsEnv: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  if (!email) return false;
  if (currentRole === Role.ADMIN) return false;
  const allowlist = parseAdminEmails(adminEmailsEnv);
  return allowlist.has(email.trim().toLowerCase());
}

function pickNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function oauthProfileRecord(profile: unknown): Record<string, unknown> | null {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return null;
  }
  return profile as Record<string, unknown>;
}

/** Writes OAuth `name` / `picture` onto `User` when the adapter left them empty. */
export async function syncUserProfileFromOAuth(args: {
  userId: string;
  profile?: unknown;
  adapterUser?: { name?: string | null; image?: string | null };
}) {
  const record = oauthProfileRecord(args.profile);
  const adapter = args.adapterUser;

  const name =
    pickNonEmptyString(record?.name) ??
    pickNonEmptyString(adapter?.name) ??
    undefined;

  const image =
    pickNonEmptyString(record?.picture) ??
    pickNonEmptyString(record?.image) ??
    pickNonEmptyString(adapter?.image) ??
    undefined;

  if (!name && !image) return;

  await prisma.user.update({
    where: { id: args.userId },
    data: {
      ...(name ? { name } : {}),
      ...(image ? { image } : {}),
    },
  });
}

export async function ensureUserBootstrap(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user) {
    throw new ApiError(404, "Authenticated user was not found.", "USER_NOT_FOUND");
  }

  let wallet = user.wallet;
  let walletLinked = !!user.wallet && user.walletId === user.wallet.id;

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
      },
    });
    walletLinked = false;
  }

  if (!walletLinked) {
    await prisma.user.update({
      where: { id: user.id },
      data: { walletId: wallet.id },
    });
  }

  let role: Role = user.role ?? Role.USER;
  if (shouldPromoteToAdmin(user.email, role)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.ADMIN },
    });
    role = Role.ADMIN;
  }

  await grantWelcomeBonusIfNeeded({ userId: user.id, wallet });

  return {
    id: user.id,
    role,
    walletId: wallet.id,
  };
}
