import { NextResponse, after } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  notifyTableQuoteReady,
  notifyTableStatusUpdate,
  notifyTableVendorAssigned,
} from "@/lib/email/table";
import { notifyKitchenChatMessage } from "@/lib/email/chat";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTableRequestById,
  insertTableRequestMessage,
  listTableRequests,
  updateTableRequest,
} from "@/lib/table/repository";
import type { TableRequestStatus } from "@/types/table";
import { confirmTablePayment } from "@/lib/table/payment";

const STATUSES = new Set<TableRequestStatus>([
  "submitted",
  "reviewing",
  "quoted",
  "accepted",
  "declined",
  "fulfilled",
]);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && STATUSES.has(statusParam as TableRequestStatus)
        ? (statusParam as TableRequestStatus)
        : undefined;
    const requests = await listTableRequests({ status, limit: 100 });
    return NextResponse.json({ requests });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdmin();
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "Request id required." }, { status: 400 });
    }

    const before = await getTableRequestById(id);
    if (!before) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const status =
      body.status && STATUSES.has(body.status)
        ? (body.status as TableRequestStatus)
        : undefined;

    if (body.markPaid) {
      const reference = String(body.paymentReference ?? "").trim();
      if (!reference) {
        return NextResponse.json({ error: "Add the transfer reference." }, { status: 400 });
      }
      if (!before.quoteAmount || before.quoteAmount < 1) {
        return NextResponse.json({ error: "Set a quote before marking paid." }, { status: 400 });
      }
      await confirmTablePayment(id, `manual ${reference}`.slice(0, 120));
      const request = await getTableRequestById(id);
      return NextResponse.json({ request });
    }

    const nextQuote =
      body.quoteAmount !== undefined
        ? body.quoteAmount == null || body.quoteAmount === ""
          ? null
          : Number(body.quoteAmount)
        : before.quoteAmount ?? null;
    if (nextQuote != null && (!Number.isFinite(nextQuote) || nextQuote < 0)) {
      return NextResponse.json({ error: "Enter a valid quote amount." }, { status: 400 });
    }
    if (status === "quoted" && (!nextQuote || nextQuote < 1)) {
      return NextResponse.json(
        { error: "Add a quote amount before sending it to the client." },
        { status: 400 },
      );
    }
    if (
      before.paymentStatus === "paid" &&
      body.quoteAmount !== undefined &&
      nextQuote !== before.quoteAmount
    ) {
      return NextResponse.json(
        { error: "This request is paid — the quote can't change now." },
        { status: 409 },
      );
    }

    const updated = await updateTableRequest(id, {
      status,
      assignedVendorId:
        body.assignedVendorId !== undefined
          ? body.assignedVendorId
            ? String(body.assignedVendorId)
            : null
          : undefined,
      quoteAmount: body.quoteAmount !== undefined ? nextQuote : undefined,
      quoteNote:
        body.quoteNote !== undefined
          ? body.quoteNote
            ? String(body.quoteNote)
            : null
          : undefined,
    });

    if (body.note && String(body.note).trim()) {
      const senderName = ctx.profile.fullName?.trim() || "Kay admin";
      const text = String(body.note).trim();
      await insertTableRequestMessage({
        requestId: id,
        senderId: ctx.userId,
        senderRole: "admin",
        senderName,
        body: text,
        channel: "customer",
      });
      after(() =>
        notifyKitchenChatMessage({
          requestId: id,
          reference: updated.reference,
          channel: "customer",
          senderRole: "admin",
          senderName,
          body: text,
          customerEmail: updated.contactEmail,
          customerName: updated.contactName,
          assignedVendorId: updated.assignedVendorId ?? null,
        }).catch((err) => console.error("[kitchen note notify]", err)),
      );
    }

    const statusChanged = status != null && status !== before.status;
    if (statusChanged) {
      after(() =>
        notifyTableStatusUpdate(updated).catch((err) =>
          console.error("[kitchen status notify]", err),
        ),
      );
    }

    if (
      updated.assignedVendorId &&
      updated.assignedVendorId !== before.assignedVendorId
    ) {
      const db = createAdminClient();
      if (db) {
        const { data: vendor } = await db
          .from("vendors")
          .select("contact_name, contact_email, business_name")
          .eq("id", updated.assignedVendorId)
          .maybeSingle();
        if (vendor?.contact_email) {
          void notifyTableVendorAssigned(
            {
              contactName: String(vendor.contact_name || "Partner"),
              contactEmail: String(vendor.contact_email),
              businessName: String(vendor.business_name || "Baker"),
            },
            updated,
          );
        }
      }
    }

    // Moving to "quoted" already sends the status email with the quote; draft
    // quotes (before the request is "quoted") stay private to Kay.
    const quoteChanged =
      !(statusChanged && status === "quoted") &&
      updated.status === "quoted" &&
      updated.quoteAmount != null &&
      updated.quoteAmount > 0 &&
      (before.quoteAmount !== updated.quoteAmount ||
        (before.quoteNote ?? "") !== (updated.quoteNote ?? ""));

    if (quoteChanged) {
      void notifyTableQuoteReady(updated);
    }

    return NextResponse.json({ request: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
