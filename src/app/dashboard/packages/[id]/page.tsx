import { PackageDetailsClient } from "@/app/dashboard/packages/[id]/package-details-client";

export default async function PackageDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackageDetailsClient packageId={id} />;
}
