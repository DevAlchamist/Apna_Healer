import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { publicProvidersQuerySchema } from "@/lib/validators/public";
import { getPublicProviders } from "@/server/services/public-content-service";

export async function GET(request: NextRequest) {
  try {
    const filters = publicProvidersQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const providers = await getPublicProviders(filters);
    return ok(providers, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
