import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders/store";
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

    const order = createOrder(body);
    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
