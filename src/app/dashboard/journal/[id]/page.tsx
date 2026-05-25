import { JournalEntryViewPage } from "@/components/dashboard/journal-entry-view-page";
import { FadeIn } from "@/components/ui/fade-in";

export default function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <FadeIn>
      <JournalEntryViewPage params={params} />
    </FadeIn>
  );
}
