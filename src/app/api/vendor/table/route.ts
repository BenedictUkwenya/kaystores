import { NextResponse } from "next/server";
import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { listTableRequests, toVendorSafeRequest } from "@/lib/table/repository";

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
