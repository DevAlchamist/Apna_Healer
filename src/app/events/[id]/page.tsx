import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { PublicEventDetailView } from "@/components/landing/public-event-detail-view";
import { getPublicEventById } from "@/server/services/public-content-service";
import { notFound } from "next/navigation";

export default async function PublicEventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getPublicEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="bg-[#f4f4f2] text-[#273331]">
      <LandingNavbar />
      <PublicEventDetailView event={event} />
      <LandingFooter />
    </div>
  );
}
