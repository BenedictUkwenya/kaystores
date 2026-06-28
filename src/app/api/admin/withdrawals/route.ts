import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  fetchPendingWithdrawals,
  updateWithdrawal,
} from "@/lib/admin/repository";

export async function GET() {
  try {
    await requireAdmin();
    const withdrawals = await fetchPendingWithdrawals();
    return Response.json({ withdrawals });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
