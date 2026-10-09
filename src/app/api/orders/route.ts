import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/orders/store";
import { validateOrderPricing } from "@/lib/pricing/validate";
import { isTestCheckoutMode } from "@/lib/pricing/config";
import { reserveStockForOrder, restoreStockForOrder } from "@/lib/products/stock";
import {
  createVendorOrderItemsFromOrder,
  fetchProductVendorMap,
} from "@/lib/vendors/repository";
import { notifyManualPaymentClaim } from "@/lib/orders/notify";
import { grantOrderAccess } from "@/lib/orders/access";
import { repriceCartItems } from "@/lib/pricing/server-cart";
import {
  attachQuoteToOrder,
  getSelectedQuoteAmount,
} from "@/lib/shipping/terminal";
import { isPaystackConfigured } from "@/lib/payments/config";
import { createPaymentShares, validateSplitCount } from "@/lib/payments/shares";
import { GIFT_NOTE_MAX_LENGTH, type CreateOrderPayload } from "@/types/order";
import { isValidEmail, matchNigerianState, normalizeNigerianPhone } from "@/lib/geo/nigeria";
import { OCCASIONS } from "@/lib/shop/taxonomy";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderPayload;
    const paystackOnline = isPaystackConfigured();

    if (!body.items?.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!body.buyer?.fullName || !body.buyer?.email || !body.buyer?.phone) {
      return NextResponse.json(
        { error: "Buyer details are required." },
        { status: 400 },
      );
    }
    if (!isValidEmail(body.buyer.email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const buyerPhone = normalizeNigerianPhone(body.buyer.phone);
    if (!buyerPhone) {
      return NextResponse.json(
        { error: "Enter a valid Nigerian phone number." },
        { status: 400 },
      );
    }
    body.buyer.phone = buyerPhone;

    const destination =
      body.deliveryType === "gift" ? body.gift?.recipientAddress : body.buyerAddress;
    if (!destination?.line1?.trim() || !destination.city?.trim() || !destination.state?.trim()) {
      return NextResponse.json(
        { error: "A full delivery address is required." },
        { status: 400 },
      );
    }
    for (const addr of [body.buyerAddress, body.gift?.recipientAddress]) {
      if (!addr) continue;
      addr.line1 = addr.line1.trim().slice(0, 200);
      addr.line2 = addr.line2?.trim().slice(0, 160) || undefined;
      addr.instructions = addr.instructions?.trim().slice(0, 300) || undefined;
      addr.state = matchNigerianState(addr.state) ?? addr.state.trim();
    }

    if (!body.pricing) {
      return NextResponse.json(
        { error: "Order pricing is required." },
        { status: 400 },
      );
    }

    const repriced = await repriceCartItems(body.items);
    if (!repriced.ok) {
      return NextResponse.json({ error: repriced.error }, { status: 400 });
    }
    body.items = repriced.items;

    if (!body.shippingQuoteToken) {
      return NextResponse.json(
        { error: "Select a live delivery service before placing your order." },
        { status: 400 },
      );
    }
    let quoteDeliveryFee: number;
    try {
      quoteDeliveryFee = await getSelectedQuoteAmount(
        body.shippingQuoteToken,
        body.items,
        destination,
      );
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Please pick a delivery rate again." },
        { status: 400 },
      );
    }
    const deliveryFee = isTestCheckoutMode() ? 0 : quoteDeliveryFee;
    const pricingCheck = validateOrderPricing(
      body.items,
      body.pricing,
      deliveryFee,
    );
    if (!pricingCheck.ok) {
      return NextResponse.json({ error: pricingCheck.error }, { status: 400 });
    }

    if (body.deliveryType === "gift") {
      if (!body.gift?.recipientName?.trim()) {
        return NextResponse.json(
          { error: "Recipient name is required for gift orders." },
          { status: 400 },
        );
      }
      if (!isValidEmail(body.gift?.recipientEmail)) {
        return NextResponse.json(
          { error: "A valid recipient email is required for gift orders." },
          { status: 400 },
        );
      }
      const recipientPhone = normalizeNigerianPhone(
        body.gift?.recipientPhone ?? body.gift?.recipientWhatsApp,
      );
      if (!recipientPhone) {
        return NextResponse.json(
          { error: "Add the recipient's phone number so the rider can reach them." },
          { status: 400 },
        );
      }
      body.gift!.recipientPhone = recipientPhone;
      body.gift!.recipientWhatsApp = recipientPhone;
      if ((body.gift?.note ?? "").length > GIFT_NOTE_MAX_LENGTH) {
        return NextResponse.json({ error: "Gift note is too long." }, { status: 400 });
      }
      const addr = body.gift.recipientAddress;
      if (!addr?.line1?.trim() || !addr.city?.trim() || !addr.state?.trim()) {
        return NextResponse.json(
          {
            error:
              "Recipient delivery address is required for gift orders.",
          },
          { status: 400 },
        );
      }
    }

    if (body.deliveryType === "gift" && body.gift) {
      const occasion = OCCASIONS.some((item) => item.slug === body.gift?.occasion)
        ? body.gift.occasion
        : undefined;
      const occasionDate = /^\d{4}-\d{2}-\d{2}$/.test(body.gift.occasionDate ?? "")
        ? body.gift.occasionDate
        : undefined;
      if (occasion && !occasionDate) {
        return NextResponse.json(
          { error: "Add the date of that occasion." },
          { status: 400 },
        );
      }
      body.gift = {
        ...body.gift,
        recipientEmail: body.gift.recipientEmail?.trim().toLowerCase(),
        recipientName: body.gift.recipientName.trim(),
        addressUnknown: false,
        occasion,
        occasionDate: occasion ? occasionDate : undefined,
        recipientEmailOn:
          occasion && occasionDate && body.gift.recipientEmailOn === "date"
            ? "date"
            : "now",
        recipientEmailSentAt: undefined,
      };
    }

    // Paystack: create unpaid orders and collect payment after redirect.
    // Manual path: still require paymentConfirmed when Paystack is offline.
    if (!paystackOnline && !body.paymentConfirmed) {
      return NextResponse.json(
        { error: "Please confirm that you have paid before placing the order." },
        { status: 400 },
      );
    }
    if (paystackOnline) {
      body.paymentConfirmed = false;
    }

    const splitCount = body.split?.count;
    if (splitCount !== undefined) {
      if (!paystackOnline) {
        return NextResponse.json(
          { error: "Split payments need online checkout." },
          { status: 400 },
        );
      }
      const splitError = validateSplitCount(body.pricing.grandTotal, splitCount);
      if (splitError) {
        return NextResponse.json({ error: splitError }, { status: 400 });
      }
    }

    body.buyer = {
      ...body.buyer,
      email: body.buyer.email.trim().toLowerCase(),
      fullName: body.buyer.fullName.trim().slice(0, 120),
      phone: buyerPhone,
    };

    const stockCheck = await reserveStockForOrder(body.items);
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.error }, { status: 400 });
    }

    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Guest checkout — no session
    }

    let order;
    try {
      order = await createOrder(body, { userId });
      await attachQuoteToOrder(order.id, body.shippingQuoteToken, body.items);

      const productIds = body.items.map((i) => i.productId);
      const vendorMap = await fetchProductVendorMap(productIds);
      const itemsWithVendor = body.items.map((item) => ({
        ...item,
        vendorId: item.vendorId ?? vendorMap.get(item.productId)?.vendorId ?? null,
      }));
      await createVendorOrderItemsFromOrder(order.id, itemsWithVendor, vendorMap, {
        paymentPaid: order.paymentStatus === "paid",
      });

      if (splitCount !== undefined) {
        await createPaymentShares(order.id, order.pricing.grandTotal, splitCount);
        return grantOrderAccess(
          NextResponse.json({ ...order, paymentMode: "split" }),
          order.id,
        );
      }

      // Emails / vendor notify only after payment is verified (webhook or admin).
      if (order.paymentStatus === "pending" && order.paymentReference === "manual-claim") {
        await notifyManualPaymentClaim(order);
      }
    } catch (err) {
      await restoreStockForOrder(body.items);
      throw err;
    }

    return grantOrderAccess(NextResponse.json(order), order.id);
  } catch {
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
