import type { Metadata } from "next";
import { BlogDetailClient } from "@/components/blog/blog-detail-client";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      subtitle: true,
      seoTitle: true,
      seoDescription: true,
      excerpt: true,
      coverImageUrl: true,
    },
  });

  if (!blog) {
    return { title: "Blog not found | ApnaHealer" };
  }

  const title = blog.seoTitle ?? blog.title;
  const description = blog.seoDescription ?? blog.excerpt ?? blog.subtitle ?? undefined;

  return {
    title: `${title} | ApnaHealer Blog`,
    description,
    openGraph: {
      title,
      description,
      images: blog.coverImageUrl ? [{ url: blog.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const shareUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/blog/${slug}`;

  const blog = await prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  const jsonLd = blog
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.coverImageUrl,
        datePublished: blog.publishedAt?.toISOString(),
        dateModified: blog.updatedAt.toISOString(),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogDetailClient slug={slug} shareUrl={shareUrl} />
    </>
  );
}
