import { wellnessPackageDetails } from "@/data/packages";
import { PackageDetailsClient } from "@/app/dashboard/packages/[id]/package-details-client";
import { notFound } from "next/navigation";

export default async function PackageDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = wellnessPackageDetails.find((entry) => entry.id === id);

  if (!detail) {
    notFound();
  }

  return <PackageDetailsClient detail={detail} />;
}
