import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";
import {
  acceptClientRecommendation,
  respondToClientRecommendation,
} from "@/lib/concierge/dispatch";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const action = String(body.action ?? "");
    const feedback = body.feedback ? String(body.feedback) : undefined;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request and action are required." },
        { status: 400 },
      );
    }

    const user = await getSessionUser();
    const email = body.email ? String(body.email) : undefined;

    if (action === "accept") {
      await acceptClientRecommendation({
        requestId,
        userId: user?.id,
        email: user?.email ?? email,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "revise" || action === "cancel") {
      await respondToClientRecommendation({
        requestId,
        action,
        feedback,
        userId: user?.id,
        email: user?.email ?? email,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Response failed.";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
