import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Order = {
  orderNumber: string;
  deliveryType?: string;
  buyer: { fullName: string; email: string; phone: string };
  gift?: {
    recipientName: string;
    recipientEmail?: string;
    anonymous?: boolean;
    note?: string;
    addressUnknown?: boolean;
  };
  handoverToken?: string;
  pricing: { grandTotal: number };
  items: {
    name: string;
    quantity: number;
    price: number;
    segment?: string;
  }[];
};

const DISCREET_ITEM = "Private catalogue selection";

function isDiscreetOrder(order: Order): boolean {
  return (
    order.items.length > 0 &&
    order.items.every((item) => item.segment === "after_dark")
  );
}

function formatOrderItems(order: Order, discreet: boolean): string {
  return order.items
    .map((item, index) => {
      const label = discreet
        ? `${DISCREET_ITEM} ${index + 1}`
        : item.name;
      return `<li>${label} × ${item.quantity} — ${naira(item.price * item.quantity)}</li>`;
    })
    .join("");
}

function formatOrderItemsText(order: Order, discreet: boolean): string {
  return order.items
    .map((item, index) => {
      const label = discreet
        ? `${DISCREET_ITEM} ${index + 1}`
        : item.name;
      return `${label} × ${item.quantity} — ${naira(item.price * item.quantity)}`;
    })
    .join("\n");
}

type Payload =
  | { type: "order_confirmation"; appUrl: string; order: Order }
  | { type: "order_internal"; appUrl: string; order: Order }
  | { type: "handover_link"; appUrl: string; order: Order }
  | { type: "handover_completed"; appUrl: string; order: Order }
  | { type: "gift_recipient"; appUrl: string; order: Order }
  | {
      type: "concierge";
      appUrl: string;
      request: {
        referenceNumber: string;
        productName: string;
        brand: string;
        budget: number;
        description: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        attachmentNames: string[];
      };
    }
  | {
      type: "contact";
      appUrl: string;
      contact: {
        firstName?: string;
        lastName?: string;
        email: string;
        subject?: string;
        message: string;
      };
    }
  | {
      type:
        | "vendor_application_received"
        | "vendor_approved"
        | "vendor_application_rejected"
        | "vendor_product_approved"
        | "vendor_product_rejected"
        | "vendor_withdrawal_update"
        | "vendor_concierge_assigned"
        | "vendor_new_order"
        | "concierge_offer_won"
        | "concierge_offer_lost";
      appUrl: string;
      vendor: {
        contactName: string;
        contactEmail: string;
        businessName: string;
      };
      productName?: string;
      orderNumber?: string;
      lineSummary?: string;
      rejectionReason?: string;
      withdrawalAmount?: number;
      withdrawalStatus?: string;
      request?: {
        referenceNumber: string;
        productName: string;
        brand: string;
        budget: number;
        description: string;
      };
    }
  | {
      type: "role_invite" | "role_upgraded";
      appUrl: string;
      recipientEmail: string;
      recipientName?: string;
      role: "admin" | "vendor";
      inviteUrl?: string;
      businessName?: string;
      reminder?: boolean;
    }
  | {
      type:
        | "concierge_offers_ready"
        | "concierge_recommendation_ready"
        | "concierge_offer_selected_client"
        | "concierge_offer_won"
        | "concierge_offer_lost"
        | "concierge_admin_alert";
      appUrl: string;
      recipientEmail?: string;
      recipientName?: string;
      alertTitle?: string;
      alertDetail?: string;
      vendor?: {
        contactName: string;
        contactEmail: string;
        businessName: string;
      };
      request: {
        referenceNumber: string;
        productName: string;
        brand?: string;
        budget?: number;
        description?: string;
        vendorBusinessName?: string;
        quotedPrice?: number;
        statusUrl?: string;
      };
    };

function defaultReplyTo(): string | undefined {
  return Deno.env.get("KAY_REPLY_TO_EMAIL") ?? Deno.env.get("KAY_TEAM_EMAIL") ?? undefined;
}

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

function siteUrl(): string {
  const fromEnv = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "");
  if (fromEnv && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromEnv)) {
    return fromEnv;
  }
  return "https://kaystores.vercel.app";
}

function layout(title: string, body: string) {
  const logo = `${siteUrl()}/brand/email-logo.png`;
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f9f7f2;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #eceae4;border-radius:12px;padding:32px">
    <div style="margin:0 0 20px;text-align:left">
      <img src="${logo}" width="48" height="48" alt="Kay Stores" style="display:block;width:48px;height:48px;border:0;outline:none" />
      <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b89a6a">Kay Stores</p>
    </div>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:400;color:#000">${title}</h1>
    ${body}
    <p style="margin-top:28px;font-size:11px;color:#8a8a8a">Kay Stores · Luxury gifting</p>
  </div></body></html>`;
}

/** Visible email CTA — plain grey links often disappear in dark mode / spam views. */
function ctaButton(href: string, label: string) {
  return `<p style="margin:24px 0 12px">
  <a href="${href}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:14px 22px;border-radius:999px">${label}</a>
</p>
<p style="color:#5c5c5c;font-size:12px;line-height:1.5;word-break:break-all">Or open this link:<br/><a href="${href}" style="color:#b89a6a;text-decoration:underline">${href}</a></p>`;
}

function buildMessage(
  payload: Payload,
): {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string[];
  tags?: { name: string; value: string }[];
} | null {
  const teamEmail = Deno.env.get("KAY_TEAM_EMAIL");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "Kay Stores <onboarding@resend.dev>";

  switch (payload.type) {
    case "order_confirmation": {
      const { order } = payload;
      const discreet = isDiscreetOrder(order);
      const items = formatOrderItems(order, discreet);
      const itemsText = formatOrderItemsText(order, discreet);
      const isGift = order.deliveryType === "gift" && order.gift;
      const recipient = order.gift?.recipientName ?? "your recipient";
      const recipientEmail = order.gift?.recipientEmail ?? "";
      const refLabel = discreet ? "private reference" : "order";
      const html = layout(
          discreet
            ? "Your private order is confirmed"
            : isGift
              ? "Your gift is on its way"
              : "Thank you for your order",
          discreet
            ? `<p style="color:#5c5c5c;line-height:1.6">Hi ${order.buyer.fullName}, we've received your confidential ${refLabel} <strong>${order.orderNumber}</strong>. Item titles are never included in this email.</p>
            <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
            <p style="font-size:18px;color:#000"><strong>Total: ${naira(order.pricing.grandTotal)}</strong></p>
            <p style="color:#5c5c5c;font-size:13px">Packaging is plain and unmarked. Payment will be collected separately — our discreet fulfilment team will be in touch shortly.</p>`
            : isGift
              ? `<p style="color:#5c5c5c;line-height:1.6">Hi ${order.buyer.fullName}, we've received your gift order <strong>${order.orderNumber}</strong> for <strong>${recipient}</strong>.</p>
            <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
            <p style="font-size:18px;color:#000"><strong>Total: ${naira(order.pricing.grandTotal)}</strong></p>
            <p style="color:#5c5c5c;font-size:13px">We've emailed <strong>${recipient}</strong>${recipientEmail ? ` at ${recipientEmail}` : ""} about this gift${order.gift?.addressUnknown ? " with a secure link to share their delivery address" : ""}. If they don't see it, ask them to check Spam and Promotions.</p>
            <p style="color:#5c5c5c;font-size:13px;margin-top:8px">Payment will be collected separately — our team will be in touch shortly.</p>`
              : `<p style="color:#5c5c5c;line-height:1.6">Hi ${order.buyer.fullName}, we've received your order <strong>${order.orderNumber}</strong>.</p>
          <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
          <p style="font-size:18px;color:#000"><strong>Total: ${naira(order.pricing.grandTotal)}</strong></p>
          <p style="color:#5c5c5c;font-size:13px">Payment will be collected separately. Our team will be in touch shortly.</p>`,
        );
      const subject = discreet
        ? `Private order confirmed — ${order.orderNumber}`
        : isGift
          ? `Gift order confirmed — ${order.orderNumber}`
          : `Order confirmed — ${order.orderNumber}`;
      const text = discreet
        ? `Hi ${order.buyer.fullName},\n\nYour confidential ${refLabel} ${order.orderNumber} is confirmed. Item titles are not included in this message.\n\n${itemsText}\n\nTotal: ${naira(order.pricing.grandTotal)}\n\n— Kay Private`
        : stripHtml(html);
      return {
        to: [order.buyer.email],
        subject,
        html,
        text,
        replyTo: teamEmail ?? undefined,
        tags: [
          {
            name: "category",
            value: discreet
              ? "private_order_confirmation"
              : isGift
                ? "gift_confirmation"
                : "order_confirmation",
          },
        ],
      };
    }
    case "order_internal": {
      if (!teamEmail) return null;
      const { order } = payload;
      const html = layout(
          "New order received",
          `<p style="color:#5c5c5c"><strong>${order.orderNumber}</strong> — ${order.buyer.fullName}<br/>
          ${order.buyer.email} · ${order.buyer.phone}<br/>
          Total: ${naira(order.pricing.grandTotal)}</p>`,
        );
      return {
        to: [teamEmail],
        subject: `[New order] ${order.orderNumber}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "order_internal" }],
      };
    }
    case "gift_recipient": {
      const { order, appUrl } = payload;
      const gift = order.gift;
      if (!gift?.recipientEmail) return null;

      const discreet = isDiscreetOrder(order);
      const senderLabel = gift.anonymous
        ? "Someone special"
        : order.buyer.fullName;
      const noteBlock = gift.note?.trim()
        ? `<p style="margin:20px 0;padding:16px;border-left:3px solid #b89a6a;background:#f9f7f2;color:#5c5c5c;font-style:italic">"${gift.note.trim()}"</p>`
        : "";
      const handoverBlock =
        gift.addressUnknown && order.handoverToken
          ? `<p style="color:#5c5c5c;line-height:1.6;margin-top:16px">To receive your ${discreet ? "private delivery" : "gift"}, please share your delivery address using this secure Kay link:</p>
          <p style="word-break:break-all;background:#f3f0ea;padding:12px;border-radius:8px;font-size:13px;margin-top:12px"><a href="${appUrl}/handover/${order.handoverToken}">${appUrl}/handover/${order.handoverToken}</a></p>`
          : `<p style="color:#5c5c5c;font-size:13px;margin-top:16px">Your ${discreet ? "delivery" : "gift"} is being prepared with white-glove care. We'll notify you when it's on its way.</p>`;

      const handoverUrl =
        gift.addressUnknown && order.handoverToken
          ? `${appUrl}/handover/${order.handoverToken}`
          : null;
      const noteText = gift.note?.trim() ? `\n\nMessage: "${gift.note.trim()}"` : "";
      const handoverText = handoverUrl
        ? `\n\nShare your delivery address: ${handoverUrl}`
        : discreet
          ? "\n\nYour private delivery is being prepared — we'll notify you when it's on its way."
          : "\n\nYour gift is being prepared — we'll notify you when it's on its way.";

      const html = layout(
          discreet ? "A private delivery is on its way" : "You've received a gift",
          discreet
            ? `<p style="color:#5c5c5c;line-height:1.6">Hi ${gift.recipientName},</p>
          <p style="color:#5c5c5c;line-height:1.6"><strong>${senderLabel}</strong> has arranged a confidential delivery through Kay's private service. No product details are included in this message.</p>
          ${noteBlock}
          ${handoverBlock}
          <p style="color:#8a8a8a;font-size:12px;margin-top:20px">Reference: ${order.orderNumber}</p>`
            : `<p style="color:#5c5c5c;line-height:1.6">Hi ${gift.recipientName},</p>
          <p style="color:#5c5c5c;line-height:1.6"><strong>${senderLabel}</strong> has chosen something special for you from Kay Stores.</p>
          ${noteBlock}
          ${handoverBlock}
          <p style="color:#8a8a8a;font-size:12px;margin-top:20px">Reference: ${order.orderNumber}</p>`,
        );

      const bcc =
        order.buyer.email.toLowerCase() !== gift.recipientEmail.toLowerCase()
          ? [order.buyer.email]
          : undefined;

      return {
        to: [gift.recipientEmail],
        bcc,
        replyTo: order.buyer.email,
        subject: discreet
          ? `Private delivery from Kay — ${order.orderNumber}`
          : `You have a gift from Kay Stores — ${order.orderNumber}`,
        html,
        text: discreet
          ? `Hi ${gift.recipientName},\n\n${senderLabel} has arranged a confidential delivery through Kay's private service. No product details are included.${noteText}${handoverText}\n\n— Kay Private`
          : `Hi ${gift.recipientName},\n\n${senderLabel} has sent you a gift from Kay Stores.${noteText}${handoverText}\n\n— Kay Stores`,
        tags: [
          {
            name: "category",
            value: discreet ? "private_gift_recipient" : "gift_recipient",
          },
        ],
      };
    }
    case "handover_link": {
      const { order, appUrl } = payload;
      const discreet = isDiscreetOrder(order);
      const link = `${appUrl}/handover/${order.handoverToken}`;
      const html = layout(
          discreet ? "Private delivery — address link" : "Digital Handover link",
          `<p style="color:#5c5c5c;line-height:1.6">Share this secure link so your recipient can provide their delivery address. No product details are included in this message.</p>
          <p style="word-break:break-all;background:#f3f0ea;padding:12px;border-radius:8px;font-size:13px"><a href="${link}">${link}</a></p>`,
        );
      return {
        to: [order.buyer.email],
        subject: discreet
          ? `Private delivery link — ${order.orderNumber}`
          : `Share this link with ${order.gift?.recipientName ?? "your recipient"}`,
        html,
        text: stripHtml(html),
        tags: [
          {
            name: "category",
            value: discreet ? "private_handover_link" : "handover_link",
          },
        ],
      };
    }
    case "handover_completed": {
      if (!teamEmail) return null;
      const { order } = payload;
      const html = layout(
          "Recipient address received",
          `<p style="color:#5c5c5c">Order <strong>${order.orderNumber}</strong> — recipient address has been submitted. Ready for fulfillment.</p>`,
        );
      return {
        to: [teamEmail],
        subject: `[Handover complete] ${order.orderNumber}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "handover_completed" }],
      };
    }
    case "contact": {
      if (!teamEmail) return null;
      const { contact } = payload;
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
      const html = layout(
          "Contact form submission",
          `<p style="color:#5c5c5c">${name || contact.email}<br/>
          <a href="mailto:${contact.email}">${contact.email}</a></p>
          <p style="color:#5c5c5c;white-space:pre-wrap">${contact.message}</p>`,
        );
      return {
        to: [teamEmail],
        subject: `[Contact] ${contact.subject || "Website enquiry"}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "contact" }],
      };
    }
    case "vendor_application_received": {
      const { vendor, appUrl } = payload;
      const html = layout(
        "Application received",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, we've received your vendor application for <strong>${vendor.businessName}</strong>. Our team will review it within 1–2 business days.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/apply">Application status</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: "Kay vendor application received",
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_application" }],
      };
    }
    case "vendor_approved": {
      const { vendor, appUrl } = payload;
      const html = layout(
        "Welcome to Kay vendors",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, <strong>${vendor.businessName}</strong> is approved. Sign in to list products and manage orders.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor">Open vendor portal</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: "You're approved — Kay vendor portal",
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_approved" }],
      };
    }
    case "vendor_application_rejected": {
      const { vendor, appUrl } = payload;
      const html = layout(
        "Vendor application update",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, thank you for applying to sell on Kay with <strong>${vendor.businessName}</strong>.</p>
        <p style="color:#5c5c5c;line-height:1.6">We're not moving forward with this application at the moment. You're welcome to re-apply later if your catalogue or fit changes.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/apply">Apply again</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: "Update on your Kay vendor application",
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_application_rejected" }],
      };
    }
    case "vendor_product_approved": {
      const { vendor, productName, appUrl } = payload;
      const html = layout(
        "Product approved",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, <strong>${productName}</strong> is now live on Kay Stores.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/products">Manage products</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Product live — ${productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_product_approved" }],
      };
    }
    case "vendor_product_rejected": {
      const { vendor, productName, rejectionReason, appUrl } = payload;
      const html = layout(
        "Product needs changes",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, <strong>${productName}</strong> was not approved.</p>
        <p style="color:#5c5c5c;font-style:italic">${rejectionReason ?? "Does not meet Kay standards."}</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/products">Edit and resubmit</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Product review — ${productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_product_rejected" }],
      };
    }
    case "vendor_withdrawal_update": {
      const { vendor, withdrawalAmount, withdrawalStatus } = payload;
      const html = layout(
        "Withdrawal update",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, your withdrawal of <strong>${naira(withdrawalAmount ?? 0)}</strong> is now <strong>${withdrawalStatus}</strong>.</p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Withdrawal ${withdrawalStatus} — Kay`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "vendor_withdrawal" }],
      };
    }
    case "vendor_concierge_assigned": {
      const { vendor, request, appUrl } = payload;
      if (!request) throw new Error("Concierge request details required");
      const brandLine = request.brand
        ? `<p style="color:#5c5c5c;line-height:1.6">Brand: <strong>${request.brand}</strong></p>`
        : "";
      const html = layout(
        "Concierge sourcing request",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, Kay has a client looking for <strong>${request.productName}</strong> (${request.referenceNumber}).</p>
        ${brandLine}
        <p style="color:#5c5c5c;line-height:1.6">Client budget: <strong>${naira(request.budget)}</strong></p>
        <p style="color:#5c5c5c;line-height:1.6">${request.description || "No additional details."}</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/concierge">Review in your vendor portal</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Concierge request — ${request.productName}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "vendor_concierge" }],
      };
    }
    case "vendor_new_order": {
      const { vendor, appUrl, orderNumber, lineSummary } = payload;
      const html = layout(
        "New paid order",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, payment is confirmed for order <strong>${orderNumber}</strong>.</p>
        <p style="color:#5c5c5c;line-height:1.6">${lineSummary || "Your catalogue items are included in this order."}</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/orders">Open vendor orders</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `New order — ${orderNumber}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "vendor_new_order" }],
      };
    }
    case "concierge_recommendation_ready": {
      const { recipientEmail, recipientName, request, appUrl } = payload;
      if (!recipientEmail) return null;
      const html = layout(
        "Your curated recommendation is ready",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${recipientName ?? "there"}, Kay has selected an option for <strong>${request.productName}</strong> (${request.referenceNumber}).</p>
        <p style="color:#5c5c5c;font-size:13px">Review the recommendation — accept, ask for changes, or cancel from your status page.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${request.statusUrl ?? `${appUrl}/concierge/status`}">View recommendation</a></p>`,
      );
      return {
        to: [recipientEmail],
        subject: `Recommendation ready — ${request.productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "concierge_recommendation_ready" }],
      };
    }
    case "concierge_offers_ready": {
      const { recipientEmail, recipientName, request, appUrl } = payload;
      if (!recipientEmail) return null;
      const html = layout(
        "Offers ready for your request",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${recipientName ?? "there"}, vendors have submitted offers for <strong>${request.productName}</strong> (${request.referenceNumber}).</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${request.statusUrl ?? `${appUrl}/concierge/status`}">Compare offers and choose your partner</a></p>`,
      );
      return {
        to: [recipientEmail],
        subject: `Offers ready — ${request.productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "concierge_offers_ready" }],
      };
    }
    case "concierge_offer_selected_client": {
      const { recipientEmail, recipientName, request } = payload;
      if (!recipientEmail) return null;
      const html = layout(
        "Offer confirmed",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${recipientName ?? "there"}, you accepted Kay's recommendation for <strong>${request.productName}</strong> at <strong>${naira(request.quotedPrice ?? 0)}</strong>.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${request.statusUrl}">View request status</a></p>`,
      );
      return {
        to: [recipientEmail],
        subject: `Offer confirmed — ${request.productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "concierge_offer_selected" }],
      };
    }
    case "concierge_offer_won": {
      const { vendor, request, appUrl } = payload;
      if (!vendor || !request) return null;
      const html = layout(
        "You won this sourcing job",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, the client selected your offer for <strong>${request.productName}</strong> (${request.referenceNumber}).</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/concierge">Open vendor portal to fulfil</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Client selected your offer — ${request.productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "concierge_offer_won" }],
      };
    }
    case "concierge_offer_lost": {
      const { vendor, request } = payload;
      if (!vendor || !request) return null;
      const html = layout(
        "Update on sourcing request",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, the client chose another partner for <strong>${request.productName}</strong> (${request.referenceNumber}). Thank you for responding.</p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Request update — ${request.productName}`,
        html,
        text: stripHtml(html),
        tags: [{ name: "category", value: "concierge_offer_lost" }],
      };
    }
    case "concierge_admin_alert": {
      const { request, appUrl, alertTitle, alertDetail } = payload;
      const teamEmail = Deno.env.get("KAY_TEAM_EMAIL");
      if (!teamEmail) return null;
      const detailBlock = alertDetail
        ? `<p style="color:#5c5c5c;line-height:1.6;white-space:pre-wrap">${alertDetail}</p>`
        : "";
      const html = layout(
        alertTitle ?? "Concierge needs attention",
        `<p style="color:#5c5c5c;line-height:1.6"><strong>${request.productName}</strong> (${request.referenceNumber})</p>
        ${request.brand ? `<p style="color:#5c5c5c">Brand: ${request.brand} · Budget: ${naira(request.budget ?? 0)}</p>` : ""}
        ${detailBlock}
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/admin/concierge">Open admin concierge</a></p>`,
      );
      return {
        to: [teamEmail],
        subject: `[Concierge] ${alertTitle ?? "Action needed"} — ${request.referenceNumber}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "concierge_admin_alert" }],
      };
    }
    case "role_invite": {
      const { recipientEmail, role, inviteUrl, appUrl, businessName, reminder } =
        payload;
      const roleLabel = role === "admin" ? "Kay admin" : "Kay vendor";
      const href = inviteUrl || `${appUrl}/signup`;
      const title = reminder
        ? `Reminder: join as ${roleLabel}`
        : `You're invited to join as ${roleLabel}`;
      const intro = reminder
        ? `<p style="color:#5c5c5c;line-height:1.6">Just a reminder — you've been invited to join Kay Stores as <strong>${roleLabel}</strong>${businessName ? ` for <strong>${businessName}</strong>` : ""}. Use the button below to finish registering.</p>`
        : `<p style="color:#5c5c5c;line-height:1.6">You've been invited to join Kay Stores as <strong>${roleLabel}</strong>${businessName ? ` for <strong>${businessName}</strong>` : ""}.</p>`;
      const html = layout(title, `${intro}${ctaButton(href, "Accept invitation & register")}`);
      return {
        to: [recipientEmail],
        subject: reminder
          ? `Reminder — ${roleLabel} invitation`
          : `Invitation — ${roleLabel} access`,
        html,
        text: `${reminder ? "Reminder: " : ""}You're invited to join Kay Stores as ${roleLabel}${businessName ? ` for ${businessName}` : ""}.\n\nAccept here: ${href}\n`,
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "role_invite" }],
      };
    }
    case "role_upgraded": {
      const { recipientEmail, recipientName, role, appUrl } = payload;
      const roleLabel = role === "admin" ? "admin" : "vendor";
      const portalUrl = role === "admin" ? `${appUrl}/admin` : `${appUrl}/vendor`;
      const html = layout(
        "Your access has been updated",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${recipientName ?? "there"}, your Kay Stores account now has <strong>${roleLabel}</strong> access.</p>
        ${ctaButton(portalUrl, `Open ${roleLabel} portal`)}`,
      );
      return {
        to: [recipientEmail],
        subject: `You're now a Kay ${roleLabel}`,
        html,
        text: `Your Kay Stores account now has ${roleLabel} access.\n\nOpen portal: ${portalUrl}\n`,
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "role_upgraded" }],
      };
    }
    default:
      return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendResend(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string[];
  tags?: { name: string; value: string }[];
}): Promise<{ id?: string; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { error: "RESEND_API_KEY not configured in Supabase secrets" };
  }

  const body: Record<string, unknown> = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };
  if (options.text) body.text = options.text;
  if (options.replyTo) body.reply_to = options.replyTo;
  if (options.bcc?.length) body.bcc = options.bcc;
  if (options.tags?.length) body.tags = options.tags;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: data?.message ?? `Resend error ${res.status}` };
  }
  return { id: data.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "Kay Stores <onboarding@resend.dev>";

    if (payload.type === "concierge") {
      const { request } = payload;
      const results: string[] = [];

      const buyerHtml = layout(
          "We've received your request",
          `<p style="color:#5c5c5c;line-height:1.6">Hi ${request.contactName}, our concierge team will review your request for <strong>${request.productName}</strong> and respond within one business day.</p>
          <p style="color:#8a8a8a;font-size:12px">Reference: ${request.referenceNumber}</p>`,
        );
      const buyer = await sendResend({
        from,
        to: [request.contactEmail],
        subject: `Concierge request received — ${request.referenceNumber}`,
        html: buyerHtml,
        text: stripHtml(buyerHtml),
      });
      if (buyer.error) {
        return new Response(JSON.stringify({ ok: false, error: buyer.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (buyer.id) results.push(buyer.id);

      const teamEmail = Deno.env.get("KAY_TEAM_EMAIL");
      if (teamEmail) {
        const teamHtml = layout(
            "New concierge request",
            `<p style="color:#5c5c5c"><strong>${request.productName}</strong> (${request.brand || "No brand"})<br/>
            Budget: ${naira(request.budget)}<br/>
            ${request.contactName} — ${request.contactEmail} · ${request.contactPhone}</p>
            <p style="color:#5c5c5c">${request.description}</p>
            <p style="color:#5c5c5c;font-size:13px"><a href="${payload.appUrl}/admin/concierge">Review in admin concierge</a></p>`,
          );
        const team = await sendResend({
          from,
          to: [teamEmail],
          subject: `[Concierge] ${request.referenceNumber} — ${request.productName}`,
          html: teamHtml,
          text: stripHtml(teamHtml),
          replyTo: defaultReplyTo(),
          tags: [{ name: "category", value: "concierge_team" }],
        });
        if (team.id) results.push(team.id);
      }

      return new Response(JSON.stringify({ ok: true, id: results[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = buildMessage(payload);
    if (!message || Array.isArray(message)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await sendResend({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      bcc: message.bcc,
      tags: message.tags,
    });
    if (result.error) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
