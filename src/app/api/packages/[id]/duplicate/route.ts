import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, failure, created } from "@/lib/api-response";
import { PackagePublicationStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return failure(403, "Forbidden. Administrator privileges required.", "FORBIDDEN");
    }

    const { id } = await context.params;

    const source = await prisma.package.findUnique({
      where: { id },
      include: {
        allocations: true
      }
    });

    if (!source) {
      return failure(404, "Source package not found.", "NOT_FOUND");
    }

    // Clone the package details and set status to DRAFT
    const duplicated = await prisma.$transaction(async (tx) => {
      const clonedPackage = await tx.package.create({
        data: {
          title: `Copy of ${source.title}`,
          subtitle: source.subtitle,
          description: source.description,
          coverImage: source.coverImage,
          galleryImages: source.galleryImages,
          bannerImage: source.bannerImage,
          price: source.price,
          discount: source.discount,
          category: source.category,
          displayOrder: source.displayOrder + 1,
          isFeatured: false,
          publicationStatus: PackagePublicationStatus.DRAFT,
          isVisible: source.isVisible,
          durationValue: source.durationValue,
          durationUnit: source.durationUnit,
          startDate: source.startDate,
          endDate: source.endDate,
          maxPurchases: source.maxPurchases,
          sections: source.sections as any,
          facilitatorNote: source.facilitatorNote,
          allocations: {
            create: source.allocations.map((a: any) => ({
              role: a.role,
              sessionCount: a.sessionCount
            }))
          }
        },
        include: {
          allocations: true
        }
      });

      return clonedPackage;
    });

    return created(duplicated);
  } catch (error) {
    return handleApiError(error);
  }
}
