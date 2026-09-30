import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { isJobKind } from "@/lib/jobs/labels";
import {
  JobActionError,
  runAdminJobAction,
  type JobActionBody,
} from "@/lib/jobs/admin-actions";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { kind, id } = await params;
    if (!isJobKind(kind)) {
      return Response.json({ error: "Unknown job type." }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as JobActionBody;
    await runAdminJobAction(kind, id, body);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof JobActionError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return apiErrorResponse(err);
  }
}
