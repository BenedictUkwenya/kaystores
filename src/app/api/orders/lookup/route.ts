import { NextResponse } from "next/server";
import { lookupOrder } from "@/lib/orders/store";
import { isOrderNumber, normalizeOrderNumber } from "@/lib/orders/resolve";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNumber?: string;
      email?: string;
    };

    const orderNumber = body.orderNumber?.trim() ?? "";
    const email = body.email?.trim() ?? "";

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Order reference and email are required." },
        { status: 400 },
      );
    }

    if (!isOrderNumber(orderNumber)) {
      return NextResponse.json(
        { error: "Enter a valid order reference (e.g. KAY-ABC123)." },
        { status: 400 },
      );
    }

    const order = await lookupOrder(normalizeOrderNumber(orderNumber), email);

    if (!order) {
      return NextResponse.json(
        { error: "No order found with that reference and email." },
        { status: 404 },
      );
    }

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
  } catch {
    return NextResponse.json(
      { error: "Could not look up order." },
      { status: 500 },
    );
  }
}
