import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";
import { selectClientOffer } from "@/lib/concierge/dispatch";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const assignmentId = String(body.assignmentId ?? "");
    const email = body.email ? String(body.email) : undefined;

    if (!requestId || !assignmentId) {
      return NextResponse.json(
        { error: "Request and offer are required." },
        { status: 400 },
      );
    }

    const user = await getSessionUser();

    await selectClientOffer({
      requestId,
      assignmentId,
      userId: user?.id,
      email: user?.email ?? email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Selection failed.";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
