import { NextResponse } from "next/server";
import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { listTableRequests, toVendorSafeRequest } from "@/lib/table/repository";
import { VendorQuoteError, submitVendorKitchenQuote } from "@/lib/table/vendor-quote";

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
    const updated = await submitVendorKitchenQuote({
      vendorId: vendor.id,
      requestId,
      amount: body.amount,
      note: body.note,
    });
    return NextResponse.json({ request: toVendorSafeRequest(updated) });
  } catch (err) {
    if (err instanceof VendorQuoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return apiErrorResponse(err);
  }
}
