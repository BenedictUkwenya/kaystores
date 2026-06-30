import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { fetchAllUsers } from "@/lib/admin/users";

export async function GET() {
  try {
    await requireAdmin();
    const users = await fetchAllUsers();
    return Response.json({ users, total: users.length });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
