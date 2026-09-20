import { NextResponse } from "next/server";
import { listShippingHubs } from "@/lib/shipping/hubs";
import { getShippingSettings } from "@/lib/shipping/settings";

/** Public options for Kay Kitchen requests — Kay delivery / hub pickup only. */
export async function GET() {
  const [settings, hubs] = await Promise.all([
    getShippingSettings(),
    listShippingHubs({ activeOnly: true }),
  ]);

  return NextResponse.json({
    delivery: {
      enabled: settings.manualEnabled,
      label: settings.manualLabel,
      eta: settings.manualEta,
    },
    hubs: hubs.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.address.city,
      state: h.address.state,
      line1: h.address.line1,
    })),
  });
}
