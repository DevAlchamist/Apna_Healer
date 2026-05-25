import { Suspense } from "react";
import { JournalWritePage } from "@/components/dashboard/journal-write-page";
import { FadeIn } from "@/components/ui/fade-in";

export default function JournalWriteRoutePage() {
  return (
    <FadeIn>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-calm bg-accent/30" />}>
        <JournalWritePage />
      </Suspense>
    </FadeIn>
  );
}
