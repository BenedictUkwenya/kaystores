import { NextResponse } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import { notifyTableRequestSubmitted } from "@/lib/email/table";
import { createTableRequest } from "@/lib/table/repository";
import { grantAccess } from "@/lib/orders/access";
import { listShippingHubs } from "@/lib/shipping/hubs";
import {
  isValidEmail,
  matchNigerianState,
  normalizeNigerianPhone,
} from "@/lib/geo/nigeria";
import type {
  TableFulfillmentMethod,
  TableRequestCategory,
} from "@/types/table";

const CATEGORIES = new Set<TableRequestCategory>([
  "cake",
  "chocolate",
  "hamper",
  "treat",
  "other",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactName = String(body.contactName ?? "").trim().slice(0, 120);
    const contactEmail = String(body.contactEmail ?? "").trim();
    if (!contactName || !isValidEmail(contactEmail)) {
      return NextResponse.json(
        { error: "Enter your name and a valid email." },
        { status: 400 },
      );
    }
    const contactPhone = normalizeNigerianPhone(String(body.contactPhone ?? ""));
    if (!contactPhone) {
      return NextResponse.json(
        { error: "Enter a valid Nigerian phone number so we can reach you." },
        { status: 400 },
      );
    }
    const recipientPhoneRaw = String(body.recipientPhone ?? "").trim();
    const recipientPhone = recipientPhoneRaw ? normalizeNigerianPhone(recipientPhoneRaw) : null;
    if (recipientPhoneRaw && !recipientPhone) {
      return NextResponse.json({ error: "Recipient phone number looks wrong." }, { status: 400 });
    }

    const neededBy = body.neededBy ? String(body.neededBy).slice(0, 10) : undefined;
    if (neededBy) {
      const today = new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || neededBy < today) {
        return NextResponse.json(
          { error: "Pick a date from today onwards." },
          { status: 400 },
        );
      }
    }

    const category = CATEGORIES.has(body.category)
      ? (body.category as TableRequestCategory)
      : "cake";

    const fulfillmentMethod: TableFulfillmentMethod =
      body.fulfillmentMethod === "pickup" ? "pickup" : "delivery";

    let city: string | undefined;
    let state: string | undefined;
    let deliveryAddress: string | undefined;
    let pickupHubId: string | undefined;
    let pickupHubName: string | undefined;

    if (fulfillmentMethod === "delivery") {
      city = String(body.city ?? "").trim().slice(0, 80);
      state = matchNigerianState(String(body.state ?? "")) ?? undefined;
      deliveryAddress = String(body.deliveryAddress ?? "").trim().slice(0, 300);
      if (!city || !state || !deliveryAddress) {
        return NextResponse.json(
          { error: "Street address, city and state are required for Kay delivery." },
          { status: 400 },
        );
      }
    } else {
      const hubs = await listShippingHubs({ activeOnly: true });
      const hub = hubs.find((h) => h.id === String(body.pickupHubId ?? ""));
      if (!hub) {
        return NextResponse.json(
          { error: "Choose a Kay hub for pickup." },
          { status: 400 },
        );
      }
      pickupHubId = hub.id;
      pickupHubName = hub.name;
    }

    const ctx = await getAuthContext();
    const created = await createTableRequest({
      contactName,
      contactEmail,
      contactPhone,
      occasion: body.occasion ? String(body.occasion).slice(0, 120) : undefined,
      servings: body.servings ? String(body.servings).slice(0, 60) : undefined,
      flavourNotes: body.flavourNotes ? String(body.flavourNotes).slice(0, 1000) : undefined,
      styleNotes: body.styleNotes ? String(body.styleNotes).slice(0, 1000) : undefined,
      neededBy,
      fulfillmentMethod,
      city,
      state,
      deliveryAddress,
      recipientName: body.recipientName ? String(body.recipientName) : undefined,
      recipientPhone: recipientPhone ?? undefined,
      allergies: body.allergies ? String(body.allergies) : undefined,
      messageOnItem: body.messageOnItem ? String(body.messageOnItem) : undefined,
      pickupHubId,
      pickupHubName,
      budget:
        body.budget != null && Number.isFinite(Number(body.budget))
          ? Number(body.budget)
          : undefined,
      category,
      userId: ctx?.userId ?? null,
    });

    void notifyTableRequestSubmitted(created);

    return grantAccess(NextResponse.json({ request: created }), "table", created.id);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
