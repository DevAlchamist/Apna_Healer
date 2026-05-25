import { JournalOverview } from "@/components/dashboard/journal-overview";
import { FadeIn } from "@/components/ui/fade-in";

export default function JournalPage() {
  return (
    <FadeIn>
      <JournalOverview />
    </FadeIn>
  );
}
