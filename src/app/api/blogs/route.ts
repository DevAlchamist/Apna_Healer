import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { blogListQuerySchema, createBlogSchema } from "@/lib/validators/blog";
import { createBlog, listAuthorBlogs } from "@/server/services/blog-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const filters = blogListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await listAuthorBlogs(user.id, filters);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const body = createBlogSchema.parse(await request.json());
    const blog = await createBlog(user.id, body);
    return created(blog);
  } catch (error) {
    return handleApiError(error);
  }
}
