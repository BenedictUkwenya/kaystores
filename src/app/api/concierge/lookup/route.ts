import { NextResponse } from "next/server";
import { lookupConciergeRequest } from "@/lib/concierge/repository";
import {
  isConciergeReference,
  normalizeConciergeReference,
} from "@/lib/concierge/status";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      referenceNumber?: string;
      email?: string;
    };

    const referenceNumber = body.referenceNumber?.trim() ?? "";
    const email = body.email?.trim() ?? "";

    if (!referenceNumber || !email) {
      return NextResponse.json(
        { error: "Reference number and email are required." },
        { status: 400 },
      );
    }

    if (!isConciergeReference(referenceNumber)) {
      return NextResponse.json(
        { error: "Enter a valid reference (e.g. CON-ABC123)." },
        { status: 400 },
      );
    }

    const found = await lookupConciergeRequest(
      normalizeConciergeReference(referenceNumber),
      email,
    );

    if (!found) {
      return NextResponse.json(
        { error: "No request found with that reference and email." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: found.id,
      referenceNumber: found.referenceNumber,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not look up request." },
      { status: 500 },
    );
  }
}
