import { NextResponse } from "next/server";
import {
  completeHandover,
  getOrderByHandoverToken,
} from "@/lib/orders/store";
import type { AddressDetails } from "@/types/order";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const order = getOrderByHandoverToken(token);

  if (!order) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  return NextResponse.json({
    handoverStatus: order.handoverStatus,
    recipientName: order.gift?.recipientName,
    anonymous: order.gift?.anonymous,
    note: order.gift?.note,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const { address } = (await request.json()) as { address: AddressDetails };

    if (!address?.line1 || !address?.city || !address?.state) {
      return NextResponse.json(
        { error: "Complete address is required." },
        { status: 400 },
      );
    }

    const order = completeHandover(token, address);

    if (!order) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save address." },
      { status: 500 },
    );
  }
}
