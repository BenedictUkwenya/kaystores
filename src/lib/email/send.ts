import { createAdminClient } from "@/lib/supabase/admin";
import type { KayEmailPayload } from "@/lib/email/types";
import type { Order } from "@/types/order";

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; error: string };

/** Invokes the Supabase Edge Function — Resend API key lives in Supabase secrets only. */
export async function sendKayEmail(
  payload: KayEmailPayload,
): Promise<SendEmailResult> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn("[email] skipped — SUPABASE_SERVICE_ROLE_KEY not set");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const { data, error } = await admin.functions.invoke("send-email", {
    body: payload,
  });

  if (error) {
    console.error("[email] edge function error:", error.message);
    return { ok: false, error: error.message };
  }

  const result = data as { ok?: boolean; id?: string; error?: string };
  if (result?.error) {
    return { ok: false, error: result.error };
  }

  return { ok: true, id: result?.id };
}

export async function notifyOrderEmails(
  order: Order,
  appUrl: string,
): Promise<SendEmailResult[]> {
  const tasks: Promise<SendEmailResult>[] = [
    sendKayEmail({ type: "order_confirmation", order, appUrl }),
    sendKayEmail({ type: "order_internal", order, appUrl }),
  ];

  if (order.deliveryType === "gift" && order.gift?.recipientEmail) {
    tasks.push(sendKayEmail({ type: "gift_recipient", order, appUrl }));
  } else if (order.handoverToken) {
    tasks.push(sendKayEmail({ type: "handover_link", order, appUrl }));
  }

  const results = await Promise.all(tasks);
  for (const result of results) {
    if (!result.ok && !result.skipped) {
      console.error("[email] send failed:", result.error);
    }
  }
  return results;
}

export async function resendGiftRecipientEmail(
  order: Order,
  appUrl: string,
): Promise<SendEmailResult> {
  if (order.deliveryType !== "gift" || !order.gift?.recipientEmail) {
    return { ok: false, error: "Not a gift order with recipient email." };
  }
  let withReveal = order;
  try {
    const { ensureGiftReveal } = await import("@/lib/reveal/repository");
    const reveal = await ensureGiftReveal(order);
    if (reveal) withReveal = { ...order, revealToken: reveal.token };
  } catch {
    // still send without reveal link
  }
  return sendKayEmail({ type: "gift_recipient", order: withReveal, appUrl });
}

export async function notifyHandoverCompleted(
  order: Order,
  appUrl: string,
): Promise<void> {
  await sendKayEmail({ type: "handover_completed", order, appUrl });
}
