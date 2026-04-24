"use client";

import { SessionProvider } from "next-auth/react";
import { AuthStatus } from "./auth-status";

export function AuthStatusSection() {
  return (
    <SessionProvider>
      <AuthStatus />
    </SessionProvider>
  );
}
