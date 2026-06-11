import { Role } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { saveBlogImage } from "@/server/services/upload-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function POST(request: Request) {
  try {
    await requireSessionUser([...MEMBER_ROLES]);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return handleApiError(new Error("File is required."));
    }
    const url = await saveBlogImage(file);
    return created({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
