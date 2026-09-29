import { NextResponse } from "next/server";
import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import {
  getTableRequestById,
  listTableRequests,
  toVendorSafeRequest,
  updateTableRequest,
} from "@/lib/table/repository";
import { notifyAdminsVendorQuoted } from "@/lib/email/table";

const MAX_VENDOR_QUOTE = 50_000_000;

export async function GET() {
  try {
    const { vendor } = await requireVendor();
    if (!vendor.canListTable) {
      return NextResponse.json(
        { error: "Kay Kitchen access required." },
        { status: 403 },
      );
    }
    const requests = await listTableRequests({
      vendorId: vendor.id,
      limit: 50,
    });
    return NextResponse.json({ requests: requests.map(toVendorSafeRequest) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/** Assigned vendor sends their price to Kay (admin adds margin before quoting the client). */
export async function POST(request: Request) {
  try {
    const { vendor } = await requireVendor();
    if (!vendor.canListTable) {
      return NextResponse.json(
        { error: "Kay Kitchen access required." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      requestId?: string;
      amount?: number | string;
      note?: string;
    };
    const requestId = String(body.requestId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_VENDOR_QUOTE) {
      return NextResponse.json(
        { error: "Enter a valid price in naira." },
        { status: 400 },
      );
    }
    const note = String(body.note ?? "").trim().slice(0, 1000) || null;

    const existing = await getTableRequestById(requestId);
    if (!existing || existing.assignedVendorId !== vendor.id) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (existing.paymentStatus !== "unpaid") {
      return NextResponse.json(
        { error: "The client has already paid — message Kay to change the price." },
        { status: 409 },
      );
    }
    if (existing.status !== "submitted" && existing.status !== "reviewing") {
      return NextResponse.json(
        {
          error:
            existing.status === "quoted"
              ? "Kay has already sent the client a quote — message Kay to change your price."
              : "This request is closed.",
        },
        { status: 409 },
      );
    }

    const updated = await updateTableRequest(requestId, {
      status: "reviewing",
      vendorQuoteAmount: amount,
      vendorQuoteNote: note,
    });

    await notifyAdminsVendorQuoted(updated).catch((err) =>
      console.error("[vendor/table] admin quote alert:", err),
    );

    return NextResponse.json({ request: toVendorSafeRequest(updated) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
