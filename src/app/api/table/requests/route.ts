import { NextResponse } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import { createTableRequest } from "@/lib/table/repository";
import type { TableRequestCategory } from "@/types/table";

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
    const contactName = String(body.contactName ?? "").trim();
    const contactEmail = String(body.contactEmail ?? "").trim();
    if (!contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const category = CATEGORIES.has(body.category)
      ? (body.category as TableRequestCategory)
      : "cake";

    const ctx = await getAuthContext();
    const created = await createTableRequest({
      contactName,
      contactEmail,
      contactPhone: body.contactPhone
        ? String(body.contactPhone).trim()
        : undefined,
      occasion: body.occasion ? String(body.occasion) : undefined,
      servings: body.servings ? String(body.servings) : undefined,
      flavourNotes: body.flavourNotes ? String(body.flavourNotes) : undefined,
      styleNotes: body.styleNotes ? String(body.styleNotes) : undefined,
      neededBy: body.neededBy ? String(body.neededBy) : undefined,
      city: body.city ? String(body.city) : undefined,
      budget:
        body.budget != null && Number.isFinite(Number(body.budget))
          ? Number(body.budget)
          : undefined,
      category,
      userId: ctx?.userId ?? null,
    });

    return NextResponse.json({ request: created });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
