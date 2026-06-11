import { AdminBlogDetailPage } from "@/components/admin/admin-blog-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogDetailRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <AdminBlogDetailPage blogId={id} />;
}
