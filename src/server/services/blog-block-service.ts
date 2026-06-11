import type { BlogBlock, Prisma } from "@prisma/client";
import { validateBlocks, type BlogBlockInput } from "@/lib/blog-blocks";
import { prisma } from "@/lib/prisma";

export async function replaceBlogBlocks(blogId: string, blocks: BlogBlockInput[]) {
  const sanitized = validateBlocks(blocks);

  await prisma.$transaction(async (tx) => {
    await tx.blogBlock.deleteMany({ where: { blogId } });
    if (sanitized.length === 0) return;

    await tx.blogBlock.createMany({
      data: sanitized.map((block, index) => ({
        blogId,
        type: block.type,
        sortOrder: index,
        data: block.data as Prisma.InputJsonValue,
      })),
    });
  });
}

export function mapBlogBlock(block: BlogBlock) {
  return {
    id: block.id,
    type: block.type,
    sortOrder: block.sortOrder,
    data: block.data as Record<string, unknown>,
  };
}

export async function getBlogBlocks(blogId: string) {
  const blocks = await prisma.blogBlock.findMany({
    where: { blogId },
    orderBy: { sortOrder: "asc" },
  });
  return blocks.map(mapBlogBlock);
}
