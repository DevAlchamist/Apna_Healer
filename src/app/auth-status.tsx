"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";

export function AuthStatus() {
  const { data, status } = useSession();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  if (status === "loading") {
    return (
      <Card className="bg-accent/60">
        <p className="text-sm text-text-primary/70">Loading session...</p>
      </Card>
    );
  }

  if (!data?.user) {
    return (
      <FadeIn delay={0.1}>
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-primary/80">Not signed in yet</p>
          <Button onClick={() => signIn("google", { callbackUrl: "/" })}>
            Sign in with Google
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const userLabel = data.user.email ?? data.user.name ?? "user";

  return (
    <FadeIn delay={0.1}>
      <Card className="space-y-4">
        <p className="text-sm text-text-primary/80">
          Signed in as{" "}
          <span className="font-semibold text-text-secondary">{userLabel}</span>
        </p>
        <Button variant="secondary" onClick={() => setIsSignOutOpen(true)}>
          Sign out
        </Button>
      </Card>
      <SignOutDialog
        open={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        userLabel={userLabel}
        callbackUrl="/"
      />
    </FadeIn>
  );
}

