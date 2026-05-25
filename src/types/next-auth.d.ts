import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      walletId: string | null;
    };
  }

  interface User {
    role: Role;
    walletId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    walletId?: string | null;
  }
}
