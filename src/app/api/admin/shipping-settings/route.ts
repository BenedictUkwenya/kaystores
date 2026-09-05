import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  getShippingSettings,
  updateShippingSettings,
} from "@/lib/shipping/settings";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getShippingSettings();
    return Response.json({ settings });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const settings = await updateShippingSettings({
      terminalEnabled:
        body.terminalEnabled != null ? Boolean(body.terminalEnabled) : undefined,
      manualEnabled:
        body.manualEnabled != null ? Boolean(body.manualEnabled) : undefined,
      manualFee:
        body.manualFee != null ? Number(body.manualFee) : undefined,
      manualLabel:
        body.manualLabel != null ? String(body.manualLabel) : undefined,
      manualEta:
        body.manualEta !== undefined
          ? body.manualEta == null
            ? null
            : String(body.manualEta)
          : undefined,
    });
    return Response.json({ settings });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
