import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, failure, noContent } from "@/lib/api-response";
import { z } from "zod";
import { PackageDurationUnit, PackagePublicationStatus, Role } from "@prisma/client";

const UpdatePackageSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  coverImage: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).optional(),
  bannerImage: z.string().url().optional().nullable(),
  price: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  category: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  publicationStatus: z.nativeEnum(PackagePublicationStatus).optional(),
  isVisible: z.boolean().optional(),
  durationValue: z.number().int().positive().optional(),
  durationUnit: z.nativeEnum(PackageDurationUnit).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  maxPurchases: z.number().int().positive().optional().nullable(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.array(z.string()).optional(),
    text: z.string().optional()
  })).optional(),
  facilitatorNote: z.string().optional().nullable(),
  allocations: z.array(z.object({
    role: z.nativeEnum(Role),
    sessionCount: z.number().int().nonnegative()
  })).optional()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const pkg = await prisma.wellnessPackage.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!pkg) {
      return failure(404, "Wellness package not found.", "NOT_FOUND");
    }

    return ok(pkg);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return failure(403, "Forbidden. Administrator privileges required.", "FORBIDDEN");
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdatePackageSchema.parse(body);

    const existing = await prisma.wellnessPackage.findUnique({
      where: { id }
    });

    if (!existing) {
      return failure(404, "Wellness package not found.", "NOT_FOUND");
    }

    const updateData: any = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.subtitle !== undefined) updateData.subtitle = parsed.subtitle;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.coverImage !== undefined) updateData.coverImage = parsed.coverImage;
    if (parsed.galleryImages !== undefined) updateData.galleryImages = parsed.galleryImages;
    if (parsed.bannerImage !== undefined) updateData.bannerImage = parsed.bannerImage;
    if (parsed.price !== undefined) {
      updateData.price = new Intl.NumberFormat('en-US', { useGrouping: false }).format(parsed.price);
    }
    if (parsed.discount !== undefined) updateData.discount = parsed.discount;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.displayOrder !== undefined) updateData.displayOrder = parsed.displayOrder;
    if (parsed.isFeatured !== undefined) updateData.isFeatured = parsed.isFeatured;
    if (parsed.publicationStatus !== undefined) {
      updateData.publicationStatus = parsed.publicationStatus;
      if (parsed.publicationStatus === PackagePublicationStatus.PUBLISHED && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (parsed.isVisible !== undefined) updateData.isVisible = parsed.isVisible;
    if (parsed.durationValue !== undefined) updateData.durationValue = parsed.durationValue;
    if (parsed.durationUnit !== undefined) updateData.durationUnit = parsed.durationUnit;
    if (parsed.startDate !== undefined) {
      updateData.startDate = parsed.startDate ? new Date(parsed.startDate) : null;
    }
    if (parsed.endDate !== undefined) {
      updateData.endDate = parsed.endDate ? new Date(parsed.endDate) : null;
    }
    if (parsed.maxPurchases !== undefined) updateData.maxPurchases = parsed.maxPurchases;
    if (parsed.sections !== undefined) updateData.sections = parsed.sections as any;
    if (parsed.facilitatorNote !== undefined) updateData.facilitatorNote = parsed.facilitatorNote;

    // Run updates in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // If allocations are specified, replace them
      if (parsed.allocations !== undefined) {
        await tx.packageSessionAllocation.deleteMany({
          where: { packageId: id }
        });
        
        await tx.packageSessionAllocation.createMany({
          data: parsed.allocations.map(a => ({
            packageId: id,
            role: a.role,
            sessionCount: a.sessionCount
          }))
        });
      }

      return tx.wellnessPackage.update({
        where: { id },
        data: updateData,
        include: {
          allocations: true
        }
      });
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return failure(403, "Forbidden. Administrator privileges required.", "FORBIDDEN");
    }

    const { id } = await context.params;

    const existing = await prisma.wellnessPackage.findUnique({
      where: { id },
      include: {
        purchases: { take: 1 }
      }
    });

    if (!existing) {
      return failure(404, "Wellness package not found.", "NOT_FOUND");
    }

    if (existing.purchases.length > 0) {
      return failure(
        400,
        "Cannot permanently delete this package because history purchases exist. Archive the package instead.",
        "CONSTRAINT_VIOLATION"
      );
    }

    await prisma.wellnessPackage.delete({
      where: { id }
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
