import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { listSupportThreads } from "@/lib/support/repository";

export async function GET() {
  try {
    await requireAdmin();
    const threads = await listSupportThreads();
    return Response.json({ threads });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
