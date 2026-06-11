import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BlogDetailRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/blog/${id}/edit`);
}
