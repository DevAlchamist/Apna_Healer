import { created, handleApiError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { walletMutationSchema } from "@/lib/validators/wallet";
import { withdrawFromWallet } from "@/server/services/wallet-service";

export async function POST(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const input = walletMutationSchema.parse(await request.json());
    const result = await withdrawFromWallet(sessionUser.id, input.amount);
    return created(result);
  } catch (error) {
    return handleApiError(error);
  }
}
