import { NextResponse } from "next/server";
import { quoteTerminalShipping } from "@/lib/shipping/terminal";
import type { AddressDetails, BuyerDetails, OrderItem } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: OrderItem[];
      destination?: AddressDetails;
      recipient?: BuyerDetails;
    };
    if (!body.items?.length || !body.destination || !body.recipient) {
      return NextResponse.json({ error: "Cart, delivery address, and recipient are required." }, { status: 400 });
    }
    const destination = body.destination;
    if (!destination.line1?.trim() || !destination.city?.trim() || !destination.state?.trim()) {
      return NextResponse.json({ error: "A complete delivery address is required." }, { status: 400 });
    }
    const quotes = await quoteTerminalShipping({
      items: body.items,
      destination,
      recipient: body.recipient,
    });
    if (!quotes.length) {
      return NextResponse.json({ error: "No delivery services are available for this address." }, { status: 422 });
    }
    return NextResponse.json({ quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not retrieve delivery rates.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
