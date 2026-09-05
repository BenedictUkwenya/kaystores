import { NextResponse } from "next/server";
import {
  createManualShippingQuote,
  quoteTerminalShipping,
} from "@/lib/shipping/terminal";
import { getShippingSettings } from "@/lib/shipping/settings";
import type { AddressDetails, BuyerDetails, OrderItem } from "@/types/order";

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: OrderItem[];
      destination?: AddressDetails;
      recipient?: BuyerDetails;
      mode?: "terminal" | "manual" | "all";
    };
    if (!body.items?.length || !body.destination || !body.recipient) {
      return NextResponse.json(
        { error: "Cart, delivery address, and recipient are required." },
        { status: 400 },
      );
    }
    const destination = body.destination;
    if (
      !destination.line1?.trim() ||
      !destination.city?.trim() ||
      !destination.state?.trim()
    ) {
      return NextResponse.json(
        { error: "A complete delivery address is required." },
        { status: 400 },
      );
    }

    const settings = await getShippingSettings();
    const mode = body.mode ?? "all";
    const quotes = [];

    if (
      (mode === "manual" || mode === "all") &&
      settings.manualEnabled
    ) {
      quotes.push(
        await createManualShippingQuote({
          items: body.items,
          destination,
        }),
      );
    }

    if (
      (mode === "terminal" || mode === "all") &&
      settings.terminalEnabled
    ) {
      try {
        const terminalQuotes = await quoteTerminalShipping({
          items: body.items,
          destination,
          recipient: body.recipient,
        });
        quotes.push(...terminalQuotes);
      } catch (err) {
        if (mode === "terminal" || quotes.length === 0) {
          throw err;
        }
        // Manual already added — return it even if Terminal fails.
      }
    }

    if (!quotes.length) {
      return NextResponse.json(
        {
          error:
            "No delivery options are available. Ask Kay to enable Terminal or Kay delivery.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ quotes, settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not retrieve delivery rates.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
