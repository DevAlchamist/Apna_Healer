import { therapists } from "@/data/therapists";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TherapistRootRedirect({ params }: PageProps) {
  const { id } = await params;
  const exists = therapists.some((t) => t.id === id);
  if (!exists) {
    notFound();
  }
  redirect(`/dashboard/therapist/${id}`);
}
