/**
 * PSP webhook placeholder — wire Flutterwave/Paystack here when payments go live.
 * Expected: verify signature, set orders.payment_status = paid, unlock vendor fulfilment.
 */
export async function POST(request: Request) {
  const body = await request.text();
  console.log("[webhooks/payments] received payload length:", body.length);

  return Response.json({
    ok: true,
    message: "Payment webhooks not configured yet. Use admin manual payment mark.",
  });
}
