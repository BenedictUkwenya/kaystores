import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/roles";
import { createConciergeRequest } from "@/lib/concierge/repository";
import { sendKayEmail } from "@/lib/email/send";
import { getEmailSiteUrl } from "@/lib/site";
import { uploadConciergeAttachments } from "@/lib/storage/concierge-attachments";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const productName = String(formData.get("productName") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const budget = Number(
      String(formData.get("budget") ?? "").replace(/[^\d]/g, ""),
    );
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

    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const requestId = randomUUID();
    const attachments = await uploadConciergeAttachments(requestId, files);

    const user = await getSessionUser();

    const created = await createConciergeRequest(
      {
        id: requestId,
        productName,
        brand,
        budget,
        description,
        contactName,
        contactEmail,
        contactPhone,
        attachmentNames: attachments.map((item) => item.name),
        attachments,
      },
      user?.id,
    );

    void sendKayEmail({
      type: "concierge",
      appUrl: getEmailSiteUrl(),
      request: created,
    });

    return NextResponse.json({
      id: created.id,
      referenceNumber: created.referenceNumber,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
