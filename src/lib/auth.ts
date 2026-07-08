import { Role } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { ensureUserBootstrap, syncUserProfileFromOAuth } from "@/server/services/auth-service";
import { emitAuthLoginEmail } from "@/server/services/platform-events";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Development Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "aanya@apnahealer.dev" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            walletId: user.walletId,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, profile }) {
      const userId =
        typeof user?.id === "string"
          ? user.id
          : typeof token.sub === "string"
            ? token.sub
            : null;

      if (!userId) {
        return token;
      }

      if (typeof user?.id === "string" && profile) {
        await syncUserProfileFromOAuth({
          userId: user.id,
          profile,
          adapterUser: { name: user.name, image: user.image },
        });
        void emitAuthLoginEmail(user.id).catch((err) =>
          console.error("[auth] welcome email failed:", err),
        );
      }

      const authUser = await ensureUserBootstrap(userId);

      token.sub = authUser.id;
      token.role = authUser.role;
      token.walletId = authUser.walletId;

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.role = (token.role as Role | undefined) ?? Role.USER;
      session.user.walletId =
        typeof token.walletId === "string" ? token.walletId : null;

      return session;
    },
  },
};

