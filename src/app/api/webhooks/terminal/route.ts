import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyTerminalSignature(signature: string | null, body: unknown) {
  const secret = process.env.TERMINAL_AFRICA_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret)
    .update(JSON.stringify(body))
    .digest("hex");
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;
  return timingSafeEqual(received, computed);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      event?: string;
      data?: {
        shipment_id?: string;
        id?: string;
        status?: string;
        extras?: Record<string, string>;
        events?: unknown[];
      };
    };

    const signature =
      request.headers.get("x-terminal-signature") ??
      request.headers.get("X-Terminal-Signature");
    if (!verifyTerminalSignature(signature, payload)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipment = payload.data;
    const terminalId = shipment?.shipment_id ?? shipment?.id;
    if (!terminalId) return Response.json({ ok: true });

    const admin = createAdminClient();
    if (!admin) throw new Error("Database is not configured.");
    const { data: saved, error } = await admin
      .from("shipments")
      .select("id, order_id")
      .eq("terminal_shipment_id", terminalId)
      .maybeSingle();
    if (error || !saved) return Response.json({ ok: true });

    const status = shipment?.status ?? "confirmed";
    const extras = shipment?.extras ?? {};
    const trackingUrl =
      extras.tracking_url ?? extras.carrier_tracking_url ?? null;
    await admin
      .from("shipments")
      .update({
        status,
        tracking_number: extras.tracking_number ?? null,
        tracking_url: trackingUrl,
        events: shipment?.events ?? [],
        ...(status === "delivered"
          ? { delivered_at: new Date().toISOString() }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", saved.id);

    const orderStatus =
      status === "delivered"
        ? "delivered"
        : status === "in-transit" ||
            status === "confirmed" ||
            payload.event === "shipment.created"
          ? "shipped"
          : undefined;

    await admin
      .from("orders")
      .update({
        ...(orderStatus ? { status: orderStatus } : {}),
        ...(extras.tracking_number
          ? { tracking_number: extras.tracking_number }
          : {}),
        ...(trackingUrl ? { tracking_url: trackingUrl } : {}),
      })
      .eq("id", saved.order_id);

    if (status === "delivered") {
      await admin
        .from("vendor_order_items")
        .update({
          fulfillment_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", saved.order_id)
        .in("fulfillment_status", ["qc_passed", "dispatched"]);
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
