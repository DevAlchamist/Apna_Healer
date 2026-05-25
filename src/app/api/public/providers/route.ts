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
    return ok(providers);
  } catch (error) {
    return handleApiError(error);
  }
}
