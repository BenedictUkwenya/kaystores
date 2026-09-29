import { NextResponse, after } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import {
  getTableRequestById,
  insertTableRequestMessage,
  updateTableRequest,
} from "@/lib/table/repository";
import { resolveTableViewer } from "@/lib/orders/access";
import { notifyTableQuoteDeclined } from "@/lib/email/table";

type Ctx = { params: Promise<{ id: string }> };

/** Client declines an open Kay Kitchen quote. */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const existing = await getTableRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const ctx = await getAuthContext();
    const isOwner = Boolean(ctx && existing.userId && existing.userId === ctx.userId);
    if (!isOwner && (ctx?.vendor || !(await resolveTableViewer(existing)))) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (existing.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This request is already paid — message us if you need to cancel." },
        { status: 409 },
      );
    }
    if (existing.status !== "quoted") {
      return NextResponse.json(
        { error: "There's no open quote to decline." },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const reason = String(body.reason ?? "").trim().slice(0, 1000);

    const updated = await updateTableRequest(id, { status: "declined" });

    const senderName =
      ctx?.profile.fullName?.trim() || existing.contactName?.trim() || "Customer";
    await insertTableRequestMessage({
      requestId: id,
      senderId: ctx?.userId ?? null,
      senderRole: "customer",
      senderName,
      body: reason ? `Declined the quote: ${reason}` : "Declined the quote.",
      channel: "customer",
    }).catch((err) => console.error("[table decline] message:", err));

    after(() =>
      notifyTableQuoteDeclined(updated, reason || undefined).catch((err) =>
        console.error("[table decline] notify:", err),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
