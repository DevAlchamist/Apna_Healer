import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getWalletForUser } from "@/server/services/wallet-service";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    const wallet = await getWalletForUser(sessionUser.id);
    return ok(wallet);
  } catch (error) {
    return handleApiError(error);
  }
}
