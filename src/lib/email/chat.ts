import { createAdminClient } from "@/lib/supabase/admin";
import { claimChatNotification, sendNotice } from "@/lib/email/notice";
import { getEmailSiteUrl } from "@/lib/site";
import type { ChatChannel } from "@/types/order-support";

type SenderRole = "admin" | "vendor" | "customer";

async function vendorContact(vendorId: string) {
  const db = createAdminClient();
  if (!db) return null;
  const { data } = await db
    .from("vendors")
    .select("contact_email, contact_name, business_name")
    .eq("id", vendorId)
    .maybeSingle();
  if (!data?.contact_email) return null;
  return {
    email: String(data.contact_email),
    name: String(data.contact_name || data.business_name || "there"),
  };
}

async function notifyTeam(input: {
  threadKey: string;
  subject: string;
  title: string;
  lead: string;
  body: string;
  ctaUrl: string;
}) {
  if (!(await claimChatNotification(input.threadKey, "team"))) return;
  await sendNotice({
    type: "chat_message",
    toTeam: true,
    subject: input.subject,
    title: input.title,
    paragraphs: [input.lead],
    quote: input.body,
    ctaUrl: input.ctaUrl,
    ctaLabel: "Open conversation",
  });
}

async function notifyPerson(input: {
  threadKey: string;
  email: string;
  name: string;
  subject: string;
  title: string;
  lead: string;
  body: string;
  ctaUrl: string;
}) {
  const recipient = input.email.trim().toLowerCase();
  if (!recipient) return;
  if (!(await claimChatNotification(input.threadKey, recipient))) return;
  await sendNotice({
    type: "chat_message",
    to: [recipient],
    subject: input.subject,
    title: input.title,
    paragraphs: [`Hi ${input.name},`, input.lead],
    quote: input.body,
    ctaUrl: input.ctaUrl,
    ctaLabel: "Reply to Kay",
  });
}

/** Kay Kitchen request chat — admin is always the relay. */
export async function notifyKitchenChatMessage(input: {
  requestId: string;
  reference: string;
  channel: ChatChannel;
  senderRole: SenderRole;
  senderName: string;
  body: string;
  customerEmail: string;
  customerName: string;
  assignedVendorId: string | null;
}) {
  const appUrl = getEmailSiteUrl();
  const threadKey = `table:${input.requestId}:${input.channel}`;

  if (input.senderRole !== "admin") {
    const who = input.senderRole === "vendor" ? "The baker" : "The customer";
    await notifyTeam({
      threadKey,
      subject: `[Kay Kitchen] New message on ${input.reference}`,
      title: "New Kay Kitchen message",
      lead: `${who} (${input.senderName}) sent a message on request ${input.reference}.`,
      body: input.body,
      ctaUrl: `${appUrl}/admin/table?request=${input.requestId}`,
    });
    return;
  }

  if (input.channel === "customer") {
    await notifyPerson({
      threadKey,
      email: input.customerEmail,
      name: input.customerName || "there",
      subject: `Kay replied on your Kay Kitchen request ${input.reference}`,
      title: "New reply from Kay",
      lead: `Kay sent you a message about your Kay Kitchen request ${input.reference}.`,
      body: input.body,
      ctaUrl: `${appUrl}/table/request/${input.requestId}`,
    });
    return;
  }

  if (!input.assignedVendorId) return;
  const vendor = await vendorContact(input.assignedVendorId);
  if (!vendor) return;
  await notifyPerson({
    threadKey,
    email: vendor.email,
    name: vendor.name,
    subject: `Kay message on Kitchen request ${input.reference}`,
    title: "New message from Kay",
    lead: `Kay sent you a message about Kitchen request ${input.reference}.`,
    body: input.body,
    ctaUrl: `${appUrl}/vendor/table`,
  });
}

/** Per-order support chat — admin is always the relay. */
export async function notifyOrderChatMessage(input: {
  orderId: string;
  orderNumber: string;
  channel: ChatChannel;
  senderRole: SenderRole;
  senderName: string;
  body: string;
  customerEmail: string;
  customerName: string;
  vendors: { email: string; name: string }[];
}) {
  const appUrl = getEmailSiteUrl();
  const threadKey = `order:${input.orderId}:${input.channel}`;

  if (input.senderRole !== "admin") {
    const who = input.senderRole === "vendor" ? "A vendor" : "The customer";
    await notifyTeam({
      threadKey,
      subject: `[Order ${input.orderNumber}] New support message`,
      title: "New order support message",
      lead: `${who} (${input.senderName}) sent a message on order ${input.orderNumber}.`,
      body: input.body,
      ctaUrl: `${appUrl}/admin/orders/${input.orderId}`,
    });
    return;
  }

  if (input.channel === "customer") {
    await notifyPerson({
      threadKey,
      email: input.customerEmail,
      name: input.customerName || "there",
      subject: `Kay replied about order ${input.orderNumber}`,
      title: "New reply from Kay",
      lead: `Kay sent you a message about order ${input.orderNumber}.`,
      body: input.body,
      ctaUrl: `${appUrl}/order/${input.orderId}`,
    });
    return;
  }

  await Promise.all(
    input.vendors.map((vendor) =>
      notifyPerson({
        threadKey,
        email: vendor.email,
        name: vendor.name,
        subject: `Kay message on order ${input.orderNumber}`,
        title: "New message from Kay",
        lead: `Kay sent you a message about order ${input.orderNumber}.`,
        body: input.body,
        ctaUrl: `${appUrl}/vendor/orders/${input.orderId}`,
      }),
    ),
  );
}
