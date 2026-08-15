import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, failure, created } from "@/lib/api-response";
import { z } from "zod";
import { PackageDurationUnit, PackagePublicationStatus, Role } from "@prisma/client";

const CreatePackageSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  coverImage: z.string().url(),
  galleryImages: z.array(z.string().url()).default([]),
  bannerImage: z.string().url().optional().nullable(),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  category: z.string().min(1),
  displayOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(false),
  publicationStatus: z.nativeEnum(PackagePublicationStatus).default(PackagePublicationStatus.DRAFT),
  isVisible: z.boolean().default(true),
  durationValue: z.number().int().positive().default(1),
  durationUnit: z.nativeEnum(PackageDurationUnit).default(PackageDurationUnit.MONTH),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  maxPurchases: z.number().int().positive().optional().nullable(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.array(z.string()).optional(),
    text: z.string().optional()
  })).default([]),
  facilitatorNote: z.string().optional().nullable(),
  allocations: z.array(z.object({
    role: z.nativeEnum(Role),
    sessionCount: z.number().int().nonnegative()
  })).default([])
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    const now = new Date();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const isFeatured = searchParams.get("isFeatured");
    const providerId = searchParams.get("providerId");

    // Standard filter criteria for end users
    const where: any = {};

    if (!isAdmin) {
      where.publicationStatus = PackagePublicationStatus.PUBLISHED;
      where.isVisible = true;
      where.OR = [
        { startDate: null },
        { startDate: { lte: now } }
      ];
      where.AND = [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ];

      if (providerId) {
        where.providerId = providerId;
      } else {
        where.providerId = null;
      }
    } else {
      // Admin filter options
      const statusParam = searchParams.get("status");
      if (statusParam) {
        where.publicationStatus = statusParam as PackagePublicationStatus;
      }
      if (providerId) {
        where.providerId = providerId;
      }
    }

    if (category) {
      where.category = category;
    }
    if (isFeatured === "true") {
      where.isFeatured = true;
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        allocations: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    // For end-users, filter out packages exceeding max purchase limit
    const activePackages = isAdmin
      ? packages
      : packages.filter((p: any) => p.maxPurchases == null || p.purchaseCount < p.maxPurchases);

    return ok(activePackages);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "THERAPIST")) {
      return failure(403, "Forbidden. Privileges required.", "FORBIDDEN");
    }

    const isTherapist = session.user.role === "THERAPIST";
    const body = await request.json();
    const parsed = CreatePackageSchema.parse(body);

    const data: any = {
      title: parsed.title,
      subtitle: parsed.subtitle,
      description: parsed.description,
      coverImage: parsed.coverImage,
      galleryImages: parsed.galleryImages,
      bannerImage: parsed.bannerImage,
      price: new Intl.NumberFormat('en-US', { useGrouping: false }).format(parsed.price),
      discount: parsed.discount,
      category: parsed.category,
      displayOrder: isTherapist ? 0 : parsed.displayOrder,
      isFeatured: isTherapist ? false : parsed.isFeatured,
      publicationStatus: parsed.publicationStatus,
      isVisible: parsed.isVisible,
      durationValue: parsed.durationValue,
      durationUnit: parsed.durationUnit,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      maxPurchases: parsed.maxPurchases,
      sections: parsed.sections as any,
      facilitatorNote: parsed.facilitatorNote,
      publishedAt: parsed.publicationStatus === PackagePublicationStatus.PUBLISHED ? new Date() : null,
    };

    if (isTherapist) {
      data.providerId = session.user.id;
      // Enforce allocation to therapist's own role
      data.allocations = {
        create: [
          {
            role: Role.THERAPIST,
            sessionCount: parsed.allocations.find(a => a.role === Role.THERAPIST)?.sessionCount ?? 1
          }
        ]
      };
    } else {
      data.allocations = {
        create: parsed.allocations.map(a => ({
          role: a.role,
          sessionCount: a.sessionCount
        }))
      };
    }

    const createdPackage = await prisma.package.create({
      data,
      include: {
        allocations: true
      }
    });

    return created(createdPackage);
  } catch (error) {
    return handleApiError(error);
  }
}
