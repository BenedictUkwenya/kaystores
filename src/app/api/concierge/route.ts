import { NextResponse } from "next/server";
import { createConciergeRequest } from "@/lib/concierge/store";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const productName = String(formData.get("productName") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const budget = Number(formData.get("budget"));
    const description = String(formData.get("description") ?? "").trim();
    const contactName = String(formData.get("contactName") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();

    if (!productName || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (!budget || budget < 1) {
      return NextResponse.json(
        { error: "Please enter a valid target budget." },
        { status: 400 },
      );
    }

    const attachmentNames: string[] = [];
    const files = formData.getAll("attachments");

    for (const entry of files) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      if (entry.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${entry.name} exceeds the 10MB limit.` },
          { status: 400 },
        );
      }
      if (entry.type && !ALLOWED_TYPES.includes(entry.type)) {
        return NextResponse.json(
          { error: `${entry.name} must be PNG, JPG, or PDF.` },
          { status: 400 },
        );
      }
      attachmentNames.push(entry.name);
    }

    const created = createConciergeRequest({
      productName,
      brand,
      budget,
      description,
      contactName,
      contactEmail,
      contactPhone,
      attachmentNames,
    });

    return NextResponse.json({
      id: created.id,
      referenceNumber: created.referenceNumber,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit request." },
      { status: 500 },
    );
  }
}
