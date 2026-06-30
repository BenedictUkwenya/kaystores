import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePlatformTags } from "@/lib/shop/taxonomy";
import { scheduleProductEmbeddingRefresh } from "@/lib/ai/embeddings";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as { tags?: string[] };
    const tags = sanitizePlatformTags(body.tags);

    const admin = createAdminClient();
    if (!admin) {
      return Response.json({ error: "Admin not configured" }, { status: 500 });
    }

    const { error } = await admin
      .from("products")
      .update({ tags })
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    scheduleProductEmbeddingRefresh(id);
    return Response.json({ ok: true, tags });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
