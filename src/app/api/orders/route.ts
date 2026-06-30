import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/orders/store";
import { validateOrderPricing } from "@/lib/pricing/validate";
import { notifyOrderEmails } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";
import { reserveStockForOrder, restoreStockForOrder } from "@/lib/products/stock";
import {
  createVendorOrderItemsFromOrder,
  fetchProductVendorMap,
} from "@/lib/vendors/repository";
import type { CreateOrderPayload } from "@/types/order";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderPayload;

    if (!body.items?.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!body.buyer?.fullName || !body.buyer?.email || !body.buyer?.phone) {
      return NextResponse.json(
        { error: "Buyer details are required." },
        { status: 400 },
      );
    }

    if (!body.pricing) {
      return NextResponse.json(
        { error: "Order pricing is required." },
        { status: 400 },
      );
    }

    const pricingCheck = validateOrderPricing(body.items, body.pricing);
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
      if (!body.gift?.recipientEmail?.trim()) {
        return NextResponse.json(
          { error: "Recipient email is required for gift orders." },
          { status: 400 },
        );
      }
    }

    if (body.deliveryType === "gift" && body.gift) {
      body.gift = {
        ...body.gift,
        recipientEmail: body.gift.recipientEmail?.trim().toLowerCase(),
        recipientName: body.gift.recipientName.trim(),
      };
    }

    body.buyer = {
      ...body.buyer,
      email: body.buyer.email.trim().toLowerCase(),
      fullName: body.buyer.fullName.trim(),
      phone: body.buyer.phone.trim(),
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

      const productIds = body.items.map((i) => i.productId);
      const vendorMap = await fetchProductVendorMap(productIds);
      const itemsWithVendor = body.items.map((item) => ({
        ...item,
        vendorId: item.vendorId ?? vendorMap.get(item.productId)?.vendorId ?? null,
      }));
      await createVendorOrderItemsFromOrder(order.id, itemsWithVendor, vendorMap);

      await notifyOrderEmails(order, getSiteUrl());
    } catch (err) {
      await restoreStockForOrder(body.items);
      throw err;
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}