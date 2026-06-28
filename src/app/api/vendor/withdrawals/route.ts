import { apiErrorResponse, requireVendor } from "@/lib/auth/roles";
import { getVendorWalletSummary, requestWithdrawal } from "@/lib/vendors/repository";

export async function GET() {
  try {
    const { vendor } = await requireVendor();
    const wallet = await getVendorWalletSummary(vendor.id);
    return Response.json(wallet);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { vendor } = await requireVendor();
    const body = await request.json();
    await requestWithdrawal(vendor, Number(body.amount));
    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
