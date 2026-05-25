import { ClubDetailPage } from "@/components/clubs/club-detail-page";
import { FadeIn } from "@/components/ui/fade-in";

export default async function DashboardClubSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <FadeIn>
      <ClubDetailPage slug={slug} />
    </FadeIn>
  );
}
