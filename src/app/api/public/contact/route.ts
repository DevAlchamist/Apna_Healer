import { handleApiError, created } from "@/lib/api-response";
import { contactInquirySchema } from "@/lib/validators/public";
import { submitContactInquiry } from "@/server/services/public-content-service";

export async function POST(request: Request) {
  try {
    const body = contactInquirySchema.parse(await request.json());
    const inquiry = await submitContactInquiry(body);
    return created({ id: inquiry.id, message: "Thank you. We will respond soon." });
  } catch (error) {
    return handleApiError(error);
  }
}
