"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";

export function AuthStatus() {
  const { data, status } = useSession();

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
          <Button onClick={() => signIn("google")}>Sign in with Google</Button>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <Card className="space-y-4">
        <p className="text-sm text-text-primary/80">
          Signed in as{" "}
          <span className="font-semibold text-text-secondary">
            {data.user.email ?? data.user.name ?? "user"}
          </span>
        </p>
        <Button variant="secondary" onClick={() => signOut()}>
          Sign out
        </Button>
      </Card>
    </FadeIn>
  );
}

