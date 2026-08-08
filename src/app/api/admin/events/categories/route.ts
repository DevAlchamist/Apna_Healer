import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, created, failure, noContent } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function GET(request: NextRequest) {
  try {
    // Both admin and other roles can fetch the categories list for select dropdowns
    const categories = await prisma.eventCategory.findMany({
      orderBy: { name: "asc" },
    });
    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const body = await request.json();
    const parsed = CreateCategorySchema.parse(body);

    const existing = await prisma.eventCategory.findUnique({
      where: { name: parsed.name },
    });

    if (existing) {
      return failure(400, "Category already exists.", "ALREADY_EXISTS");
    }

    const category = await prisma.eventCategory.create({
      data: { name: parsed.name },
    });

    return created(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return failure(400, "Category ID is required.", "BAD_REQUEST");
    }

    const existing = await prisma.eventCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return failure(404, "Category not found.", "NOT_FOUND");
    }

    await prisma.eventCategory.delete({
      where: { id },
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
