import { createAdminClient } from "@/lib/supabase/admin";
import type { KayEmailPayload } from "@/lib/email/types";
import type { Order } from "@/types/order";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { deliverKayEmail } from "@/lib/email/render";

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; error: string };

async function edgeFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      // fall through
    }
    const status = error.context.status;
    if (status === 401) {
      return "Email service unauthorized — check SUPABASE_SERVICE_ROLE_KEY on Vercel matches your Supabase project (Settings → API).";
    }
    if (status === 500) {
      return "Email provider error — confirm RESEND_API_KEY and RESEND_FROM_EMAIL in Supabase Edge secrets.";
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("non-2xx")) {
      return "Email service rejected the request. Check Supabase send-email logs and Resend configuration.";
    }
    return error.message;
  }
  return "Email send failed.";
}

/**
 * Sends via Resend straight from the server when RESEND_API_KEY is set;
 * otherwise falls back to the Supabase send-email Edge Function.
 */
export async function sendKayEmail(
  payload: KayEmailPayload,
): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      const result = await deliverKayEmail(
        payload as unknown as Parameters<typeof deliverKayEmail>[0],
      );
      if (!result.ok) {
        console.error(`[email:${payload.type}]`, result.error);
        return { ok: false, error: result.error ?? "Email send failed." };
      }
      return { ok: true, id: result.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email send failed.";
      console.error(`[email:${payload.type}]`, message);
      return { ok: false, error: message };
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    console.warn("[email] skipped — SUPABASE_SERVICE_ROLE_KEY not set");
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return {
      ok: false,
      skipped: true,
      error: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  };
  const invokeSecret = process.env.EMAIL_INVOKE_SECRET?.trim();
  if (invokeSecret) {
    headers["x-kay-email-secret"] = invokeSecret;
  }

  const { data, error } = await admin.functions.invoke("send-email", {
    body: payload,
    headers,
  });

  if (error) {
    const message = await edgeFunctionErrorMessage(error);
    console.error("[email] edge function error:", message);
    return { ok: false, error: message };
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
  const { orderAccessPath } = await import("@/lib/orders/access");
  const tasks: Promise<SendEmailResult>[] = [
    sendKayEmail({
      type: "order_confirmation",
      order: { ...order, accessUrl: `${appUrl}${orderAccessPath(order.id)}` },
      appUrl,
    }),
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
