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
  revealToken?: string;
  accessUrl?: string;
  id?: string;
  anonymousPackaging?: boolean;
  buyerAddress?: Address;
  recipientAddress?: Address;
  pricing: { grandTotal: number };
  items: {
    name: string;
    quantity: number;
    price: number;
    segment?: string;
  }[];
};

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  instructions?: string;
};

function formatAddressHtml(address?: Address): string {
  if (!address) return "";
  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return lines.join("<br/>");
}

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
      adminEmails?: string[];
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
        | "vendor_hub_dispatch_reminder"
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
      hubOptions?: { name: string; phone: string; address: string }[];
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
      type: "auth_otp";
      to: string;
      token: string;
      action: "signup" | "recovery" | "magiclink" | "email_change" | string;
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
      adminEmails?: string[];
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
    }
  | {
      type: "table_request";
      appUrl: string;
      adminEmails?: string[];
      request: {
        reference: string;
        contactName: string;
        contactEmail: string;
        contactPhone?: string;
        category: string;
        occasion?: string;
        servings?: string;
        flavourNotes?: string;
        styleNotes?: string;
        neededBy?: string;
        fulfillmentMethod?: string;
        city?: string;
        state?: string;
        pickupHubName?: string;
        statusUrl?: string;
        allergies?: string;
        messageOnItem?: string;
        deliveryAddress?: string;
        recipientName?: string;
        recipientPhone?: string;
        photoCount?: number;
      };
    }
  | {
      type: "table_quote_ready";
      appUrl: string;
      request: {
        reference: string;
        contactName: string;
        contactEmail: string;
        quoteAmount?: number;
        quoteNote?: string;
        statusUrl?: string;
      };
    }
  | {
      type: "table_vendor_assigned";
      appUrl: string;
      vendor: {
        contactName: string;
        contactEmail: string;
        businessName: string;
      };
      request: {
        reference: string;
        contactName: string;
        category: string;
        occasion?: string;
        servings?: string;
        flavourNotes?: string;
        styleNotes?: string;
        neededBy?: string;
        fulfillmentMethod?: string;
        city?: string;
        state?: string;
        pickupHubName?: string;
        quoteAmount?: number;
        quoteNote?: string;
        allergies?: string;
        messageOnItem?: string;
      };
    }
  | {
      type:
        | "chat_message"
        | "table_status_update"
        | "vendor_dispatch_overdue"
        | "split_payment_update"
        | "admin_alert"
        | "order_update"
        | "vendor_update"
        | "kitchen_update"
        | "concierge_update";
      appUrl: string;
      /** Direct recipients. */
      to?: string[];
      /** Also send to every admin + KAY_TEAM_EMAIL. */
      toTeam?: boolean;
      adminEmails?: string[];
      subject: string;
      title: string;
      paragraphs: string[];
      /** Quoted user-written text (escaped before rendering). */
      quote?: string;
      ctaUrl?: string;
      ctaLabel?: string;
    };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultReplyTo(): string | undefined {
  return Deno.env.get("KAY_REPLY_TO_EMAIL") ?? Deno.env.get("KAY_TEAM_EMAIL") ?? undefined;
}

/** Merge listed admin inboxes with KAY_TEAM_EMAIL (unique, lowercased). */
function teamRecipients(adminEmails?: string[]): string[] | null {
  const set = new Set<string>();
  for (const raw of adminEmails ?? []) {
    const email = raw.trim().toLowerCase();
    if (email) set.add(email);
  }
  const teamEmail = Deno.env.get("KAY_TEAM_EMAIL")?.trim().toLowerCase();
  if (teamEmail) set.add(teamEmail);
  return set.size ? [...set] : null;
}

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

function siteUrl(): string {
  const fromEnv = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "");
  if (fromEnv && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromEnv)) {
    return fromEnv;
  }
  return "https://shoponkay.com";
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
      const viewCta = order.accessUrl
        ? ctaButton(order.accessUrl, discreet ? "View private order" : "View your order")
        : "";
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
            <p style="color:#5c5c5c;font-size:13px">Payment received. Packaging is plain and unmarked — we'll email you when it's on its way.</p>
            ${viewCta}`
            : isGift
              ? `<p style="color:#5c5c5c;line-height:1.6">Hi ${order.buyer.fullName}, we've received your gift order <strong>${order.orderNumber}</strong> for <strong>${recipient}</strong>.</p>
            <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
            <p style="font-size:18px;color:#000"><strong>Total: ${naira(order.pricing.grandTotal)}</strong></p>
            <p style="color:#5c5c5c;font-size:13px">We've emailed <strong>${recipient}</strong>${recipientEmail ? ` at ${recipientEmail}` : ""} about this gift${order.gift?.addressUnknown ? " with a secure link to share their delivery address" : ""}. If they don't see it, ask them to check Spam and Promotions.</p>
            <p style="color:#5c5c5c;font-size:13px;margin-top:8px">Payment received — we'll email you when it ships.</p>
            ${viewCta}`
              : `<p style="color:#5c5c5c;line-height:1.6">Hi ${order.buyer.fullName}, we've received your order <strong>${order.orderNumber}</strong>.</p>
          <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
          <p style="font-size:18px;color:#000"><strong>Total: ${naira(order.pricing.grandTotal)}</strong></p>
          <p style="color:#5c5c5c;font-size:13px">Payment received — we'll email you when it ships.</p>
          ${viewCta}`,
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
      const { order, appUrl } = payload;
      const isGift = order.deliveryType === "gift";
      const destination = isGift ? order.recipientAddress : order.buyerAddress;
      const destinationHtml = formatAddressHtml(destination);
      const instructions = destination?.instructions;
      const items = order.items
        .map((item) => `<li>${item.name} × ${item.quantity} — ${naira(item.price * item.quantity)}</li>`)
        .join("");
      const html = layout(
          "New order received",
          `<p style="color:#5c5c5c"><strong>${order.orderNumber}</strong> — ${order.buyer.fullName}<br/>
          ${order.buyer.email} · ${order.buyer.phone}<br/>
          Total: ${naira(order.pricing.grandTotal)}</p>
          <ul style="color:#5c5c5c;padding-left:18px">${items}</ul>
          ${
            isGift
              ? `<p style="color:#5c5c5c"><strong>Gift for:</strong> ${order.gift?.recipientName ?? "—"}${order.gift?.recipientEmail ? ` · ${order.gift.recipientEmail}` : ""}${order.gift?.addressUnknown ? "<br/><em>Recipient will share their address via the handover link.</em>" : ""}</p>`
              : ""
          }
          ${destinationHtml ? `<p style="color:#5c5c5c"><strong>Deliver to:</strong><br/>${destinationHtml}</p>` : ""}
          ${instructions ? `<p style="color:#5c5c5c"><strong>Delivery note:</strong> ${instructions}</p>` : ""}
          ${order.anonymousPackaging ? `<p style="color:#5c5c5c"><strong>Plain packaging requested.</strong></p>` : ""}
          ${order.id ? ctaButton(`${appUrl}/admin/orders/${order.id}`, "Open in admin") : ""}`,
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
      const revealUrl = order.revealToken
        ? `${appUrl}/reveal/${order.revealToken}`
        : null;
      const revealBlock = revealUrl
        ? `<p style="color:#5c5c5c;line-height:1.6;margin-top:16px">Something personal is waiting — scan the Kay Reveal QR on your box, or open it here:</p>
          ${ctaButton(revealUrl, "Open your Kay Reveal")}`
        : "";
      const handoverBlock =
        gift.addressUnknown && order.handoverToken
          ? `<p style="color:#5c5c5c;line-height:1.6;margin-top:16px">To receive your ${discreet ? "private delivery" : "gift"}, please share your delivery address using this secure Kay link:</p>
          <p style="word-break:break-all;background:#f3f0ea;padding:12px;border-radius:8px;font-size:13px;margin-top:12px"><a href="${appUrl}/handover/${order.handoverToken}">${appUrl}/handover/${order.handoverToken}</a></p>`
          : revealBlock
            ? ""
            : `<p style="color:#5c5c5c;font-size:13px;margin-top:16px">Your ${discreet ? "delivery" : "gift"} is being prepared with white-glove care. We'll notify you when it's on its way.</p>`;

      const handoverUrl =
        gift.addressUnknown && order.handoverToken
          ? `${appUrl}/handover/${order.handoverToken}`
          : null;
      const noteText = gift.note?.trim() ? `\n\nMessage: "${gift.note.trim()}"` : "";
      const revealText = revealUrl
        ? `\n\nOpen your Kay Reveal: ${revealUrl}`
        : "";
      const handoverText = handoverUrl
        ? `\n\nShare your delivery address: ${handoverUrl}`
        : revealText
          ? revealText
          : discreet
            ? "\n\nYour private delivery is being prepared — we'll notify you when it's on its way."
            : "\n\nYour gift is being prepared — we'll notify you when it's on its way.";

      const html = layout(
          discreet ? "A private delivery is on its way" : "You've received a gift",
          discreet
            ? `<p style="color:#5c5c5c;line-height:1.6">Hi ${gift.recipientName},</p>
          <p style="color:#5c5c5c;line-height:1.6"><strong>${senderLabel}</strong> has arranged a confidential delivery through Kay's private service. No product details are included in this message.</p>
          ${noteBlock}
          ${revealBlock}
          ${handoverBlock}
          <p style="color:#8a8a8a;font-size:12px;margin-top:20px">Reference: ${order.orderNumber}</p>`
            : `<p style="color:#5c5c5c;line-height:1.6">Hi ${gift.recipientName},</p>
          <p style="color:#5c5c5c;line-height:1.6"><strong>${senderLabel}</strong> has chosen something special for you from Kay Stores.</p>
          ${noteBlock}
          ${revealBlock}
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
      const { vendor, appUrl, orderNumber, lineSummary, hubOptions } = payload;
      const hubBlock =
        hubOptions && hubOptions.length
          ? `<p style="color:#5c5c5c;line-height:1.6;margin-top:16px"><strong>Send to a nearby hub</strong> — pick one, attach the phone number on the parcel, then mark dispatched in your portal:</p>
        <ul style="color:#5c5c5c;line-height:1.7;padding-left:18px">${hubOptions
          .map(
            (h) =>
              `<li><strong>${h.name}</strong><br/>${h.address}<br/>Attach phone: <strong>${h.phone}</strong></li>`,
          )
          .join("")}</ul>`
          : `<p style="color:#5c5c5c;line-height:1.6;margin-top:16px">Open your vendor portal to choose a hub and get the phone number to attach.</p>`;
      const html = layout(
        "New paid order",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, payment is confirmed for order <strong>${orderNumber}</strong>.</p>
        <p style="color:#5c5c5c;line-height:1.6">${lineSummary || "Your catalogue items are included in this order."}</p>
        ${hubBlock}
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
    case "vendor_hub_dispatch_reminder": {
      const { vendor, appUrl, orderNumber, productName, hubOptions } = payload;
      const hubBlock =
        hubOptions && hubOptions.length
          ? `<ul style="color:#5c5c5c;line-height:1.7;padding-left:18px">${hubOptions
              .map(
                (h) =>
                  `<li><strong>${h.name}</strong> — attach <strong>${h.phone}</strong><br/>${h.address}</li>`,
              )
              .join("")}</ul>`
          : "";
      const html = layout(
        "Reminder — send to hub",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, order <strong>${orderNumber}</strong>${
          productName ? ` (${productName})` : ""
        } is still waiting for hub dispatch (12+ hours since payment).</p>
        <p style="color:#5c5c5c;line-height:1.6">Please choose a hub, attach the phone number on the parcel, send it, then mark <strong>dispatched</strong> in your portal.</p>
        ${hubBlock}
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/orders">Open vendor orders</a></p>`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Reminder — dispatch order ${orderNumber}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "vendor_hub_dispatch_reminder" }],
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
        <p style="color:#5c5c5c;line-height:1.6">Once they pay, open your vendor portal — you'll see which Kay hub to bring the item to and when to start sourcing.</p>
        <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/vendor/concierge">Open vendor concierge</a></p>`,
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
      const { request, appUrl, alertTitle, alertDetail, adminEmails } = payload;
      const recipients = teamRecipients(adminEmails);
      if (!recipients) return null;
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
        to: recipients,
        subject: `[Concierge] ${alertTitle ?? "Action needed"} — ${request.referenceNumber}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "concierge_admin_alert" }],
      };
    }
    case "table_quote_ready": {
      const { request, appUrl } = payload;
      if (!request.contactEmail) return null;
      const amount =
        request.quoteAmount != null ? naira(request.quoteAmount) : "your quote";
      const noteBlock = request.quoteNote?.trim()
        ? `<p style="color:#5c5c5c;line-height:1.6;white-space:pre-wrap">${request.quoteNote.trim()}</p>`
        : "";
      const statusBlock = request.statusUrl
        ? ctaButton(request.statusUrl, "View your Kay Kitchen request")
        : "";
      const html = layout(
        "Your Kay Kitchen quote is ready",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${request.contactName}, we've prepared a quote for your request <strong>${request.reference}</strong>.</p>
        <p style="font-size:18px;color:#000"><strong>${amount}</strong></p>
        ${noteBlock}
        <p style="color:#5c5c5c;line-height:1.6">Accept &amp; pay or decline on your request page.</p>
        ${statusBlock}`,
      );
      return {
        to: [request.contactEmail],
        subject: `Kay Kitchen quote — ${request.reference}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "table_quote_ready" }],
      };
    }
    case "table_vendor_assigned": {
      const { vendor, request, appUrl } = payload;
      if (!vendor?.contactEmail) return null;
      const fulfilment =
        request.fulfillmentMethod === "pickup"
          ? `Pickup — ${request.pickupHubName || "Kay hub"}`
          : `Kay delivery — ${[request.city, request.state].filter(Boolean).join(", ") || "TBC"}`;
      const html = layout(
        "New Kay Kitchen brief assigned",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${vendor.contactName}, you've been assigned <strong>${request.reference}</strong> (${request.category}).</p>
        <p style="color:#5c5c5c;line-height:1.6">Client: ${request.contactName}<br/>
        Servings: ${request.servings || "—"} · Needed by: ${request.neededBy || "—"}<br/>
        Flavours: ${request.flavourNotes || "—"}<br/>
        Style: ${request.styleNotes || "—"}<br/>
        ${request.messageOnItem ? `Message on item: “${request.messageOnItem}”<br/>` : ""}
        ${request.allergies ? `<strong>Allergies / dietary: ${request.allergies}</strong><br/>` : ""}
        Fulfilment: ${fulfilment}</p>
        <p style="color:#5c5c5c;line-height:1.6">Please review the brief and send Kay your price from your Kay Kitchen dashboard.</p>
        ${ctaButton(`${appUrl}/vendor/table`, "Send your price")}`,
      );
      return {
        to: [vendor.contactEmail],
        subject: `Kay Kitchen assigned — ${request.reference}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "table_vendor_assigned" }],
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
    case "auth_otp": {
      const { to, token, action } = payload;
      const code = `<p style="margin:24px 0;font-size:32px;letter-spacing:0.35em;font-weight:600;color:#000;text-align:center">${token}</p>`;
      const expiry =
        `<p style="margin-top:28px;font-size:11px;color:#8a8a8a">This code expires in 1 hour. If you didn't request this, you can ignore this email.</p>`;
      let title = "Verification code";
      let intro =
        `<p style="color:#5c5c5c;line-height:1.6">Enter this code to continue:</p>`;
      let subject = "Your Kay verification code";
      if (action === "signup") {
        title = "Your verification code";
        intro =
          `<p style="color:#5c5c5c;line-height:1.6">Welcome to Kay. Enter this code on the verification screen to finish creating your account:</p>`;
        subject = "Verify your Kay account";
      } else if (action === "recovery") {
        title = "Password reset code";
        intro =
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to reset your password:</p>`;
        subject = "Reset your Kay password";
      } else if (action === "magiclink") {
        title = "Sign-in code";
        intro =
          `<p style="color:#5c5c5c;line-height:1.6">Enter this code to sign in:</p>`;
        subject = "Your Kay sign-in code";
      }
      const html = layout(title, `${intro}${code}${expiry}`);
      return {
        to: [to],
        subject,
        html,
        text: `${title}: ${token}`,
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "auth_otp" }],
      };
    }
    case "support_message": {
      const { audience, to, preview, senderName, deepLink } = payload;
      if (audience === "team") {
        if (!teamEmail) return null;
        const html = layout(
          "New support message",
          `<p style="color:#5c5c5c;line-height:1.6">${senderName || "A customer"} sent a message in Kay Support.</p>
          <p style="color:#5c5c5c;white-space:pre-wrap;line-height:1.6">${preview || "[Image attached]"}</p>
          ${ctaButton(deepLink, "Open support inbox")}`,
        );
        return {
          to: [teamEmail],
          subject: `[Support] ${senderName || "New message"}`,
          html,
          text: stripHtml(html),
          tags: [{ name: "category", value: "support_message" }],
        };
      }
      const html = layout(
        "Reply from Kay Support",
        `<p style="color:#5c5c5c;line-height:1.6">You have a new reply from the Kay team.</p>
        <p style="color:#5c5c5c;white-space:pre-wrap;line-height:1.6">${preview || "[Image attached]"}</p>
        ${ctaButton(deepLink, "Open conversation")}`,
      );
      return {
        to: [to],
        subject: "New reply from Kay Support",
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "support_message" }],
      };
    }
    case "gift_reveal_opened": {
      const { to, buyerName, recipientName, orderNumber, orderId, appUrl } =
        payload;
      const html = layout(
        "Your Kay Reveal was opened",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${buyerName},</p>
        <p style="color:#5c5c5c;line-height:1.6"><strong>${recipientName}</strong> just opened the Kay Reveal on order <strong>${orderNumber}</strong>.</p>
        ${ctaButton(payload.orderUrl || `${appUrl}/order/${orderId}`, "View your order")}`,
      );
      return {
        to: [to],
        subject: `Kay Reveal opened — ${orderNumber}`,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "gift_reveal_opened" }],
      };
    }
    case "chat_message":
    case "table_status_update":
    case "vendor_dispatch_overdue":
    case "split_payment_update":
    case "admin_alert":
    case "order_update":
    case "vendor_update":
    case "kitchen_update":
    case "concierge_update": {
      const recipients = new Set<string>();
      for (const raw of payload.to ?? []) {
        const email = raw.trim().toLowerCase();
        if (email) recipients.add(email);
      }
      if (payload.toTeam) {
        for (const email of teamRecipients(payload.adminEmails) ?? []) {
          recipients.add(email);
        }
      }
      if (!recipients.size) return null;
      const paragraphs = payload.paragraphs
        .map(
          (p) =>
            `<p style="color:#5c5c5c;line-height:1.6">${escapeHtml(p)}</p>`,
        )
        .join("");
      const quote = payload.quote
        ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #b89a6a;background:#f9f7f2;color:#333;white-space:pre-wrap;line-height:1.6">${escapeHtml(payload.quote.slice(0, 600))}</blockquote>`
        : "";
      const cta =
        payload.ctaUrl && payload.ctaLabel
          ? ctaButton(payload.ctaUrl, escapeHtml(payload.ctaLabel))
          : "";
      const html = layout(escapeHtml(payload.title), `${paragraphs}${quote}${cta}`);
      return {
        to: [...recipients],
        subject: payload.subject,
        html,
        text: stripHtml(html),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: payload.type }],
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

/** Notice types escape their own fields inside buildMessage. */
const SELF_ESCAPING = new Set([
  "chat_message",
  "table_status_update",
  "vendor_dispatch_overdue",
  "split_payment_update",
  "admin_alert",
  "order_update",
  "vendor_update",
  "kitchen_update",
  "concierge_update",
]);

/** Keys that are addresses/identifiers, never rendered as user prose. */
const RAW_KEYS = new Set([
  "type",
  "to",
  "bcc",
  "adminEmails",
  "token",
  "action",
  "audience",
  "email",
  "recipientEmail",
  "contactEmail",
]);

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function escapeDeep<T>(value: T, key = ""): T {
  if (RAW_KEYS.has(key)) return value;
  if (typeof value === "string") return escapeHtml(value) as T;
  if (Array.isArray(value)) return value.map((v) => escapeDeep(v)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = escapeDeep(v, k);
    }
    return out as T;
  }
  return value;
}

function jwtRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

async function keyHasServiceAccess(key: string): Promise<boolean> {
  if (!key) return false;
  if (jwtRole(key) === "service_role") return true;
  const base = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  if (!base) return false;
  const res = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  return res.ok;
}

async function isAuthorized(req: Request): Promise<boolean> {
  const invokeSecret = Deno.env.get("EMAIL_INVOKE_SECRET")?.trim();
  const headerSecret = req.headers.get("x-kay-email-secret")?.trim() ?? "";
  if (invokeSecret && headerSecret && invokeSecret === headerSecret) {
    return true;
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const bearer =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const apikey = req.headers.get("apikey")?.trim() ?? "";
  const candidates = [...new Set([bearer, apikey].filter(Boolean))];

  for (const key of candidates) {
    if (serviceKey && key === serviceKey) return true;
  }
  for (const key of candidates) {
    if (await keyHasServiceAccess(key)) return true;
  }
  return false;
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
    subject: decodeEntities(options.subject),
    html: options.html,
  };
  if (options.text) body.text = decodeEntities(options.text);
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

  if (!(await isAuthorized(req))) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = (await req.json()) as Payload;
    const payload = SELF_ESCAPING.has(raw.type) ? raw : escapeDeep(raw);
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

      const recipients = teamRecipients(payload.adminEmails);
      if (recipients) {
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
          to: recipients,
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

    if (payload.type === "table_request") {
      const { request, appUrl, adminEmails } = payload;
      const results: string[] = [];

      const statusBlock = request.statusUrl
        ? ctaButton(request.statusUrl, "Track your request")
        : "";
      const buyerHtml = layout(
        "We've received your Kay Kitchen request",
        `<p style="color:#5c5c5c;line-height:1.6">Hi ${request.contactName}, our kitchen team will review your ${request.category} brief and follow up shortly.</p>
        <p style="color:#8a8a8a;font-size:12px">Reference: ${request.reference}</p>
        ${statusBlock}`,
      );
      const buyer = await sendResend({
        from,
        to: [request.contactEmail],
        subject: `Kay Kitchen request received — ${request.reference}`,
        html: buyerHtml,
        text: stripHtml(buyerHtml),
        replyTo: defaultReplyTo(),
        tags: [{ name: "category", value: "table_request_client" }],
      });
      if (buyer.error) {
        return new Response(JSON.stringify({ ok: false, error: buyer.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (buyer.id) results.push(buyer.id);

      const recipients = teamRecipients(adminEmails);
      if (recipients) {
        const fulfilment =
          request.fulfillmentMethod === "pickup"
            ? `Pickup — ${request.pickupHubName || "Kay hub"}`
            : `Kay delivery — ${[request.city, request.state].filter(Boolean).join(", ") || "TBC"}`;
        const teamHtml = layout(
          "New Kay Kitchen request",
          `<p style="color:#5c5c5c"><strong>${request.reference}</strong> · ${request.category}<br/>
          ${request.contactName} — ${request.contactEmail}${request.contactPhone ? ` · ${request.contactPhone}` : ""}</p>
          <p style="color:#5c5c5c;line-height:1.6">Servings: ${request.servings || "—"} · Needed by: ${request.neededBy || "—"}<br/>
          Flavours: ${request.flavourNotes || "—"}<br/>
          Style: ${request.styleNotes || "—"}<br/>
          ${request.messageOnItem ? `Message on item: “${request.messageOnItem}”<br/>` : ""}
          ${request.allergies ? `<strong>Allergies / dietary: ${request.allergies}</strong><br/>` : ""}
          ${request.deliveryAddress ? `Deliver to: ${request.recipientName ? `${request.recipientName}, ` : ""}${request.deliveryAddress}${request.recipientPhone ? ` · ${request.recipientPhone}` : ""}<br/>` : ""}
          Fulfilment: ${fulfilment}
          ${request.photoCount ? `<br/><strong>${request.photoCount} inspiration photo${request.photoCount > 1 ? "s" : ""} attached</strong> — view in admin.` : ""}</p>
          <p style="color:#5c5c5c;font-size:13px"><a href="${appUrl}/admin/table">Open admin Kay Kitchen</a></p>`,
        );
        const team = await sendResend({
          from,
          to: recipients,
          subject: `[Kay Kitchen] ${request.reference} — ${request.category}`,
          html: teamHtml,
          text: stripHtml(teamHtml),
          replyTo: defaultReplyTo(),
          tags: [{ name: "category", value: "table_request_admin" }],
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
