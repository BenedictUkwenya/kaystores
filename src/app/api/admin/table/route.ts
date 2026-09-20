import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth/roles";
import {
  insertTableRequestMessage,
  listTableRequests,
  updateTableRequest,
} from "@/lib/table/repository";
import type { TableRequestStatus } from "@/types/table";

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

    const status =
      body.status && STATUSES.has(body.status)
        ? (body.status as TableRequestStatus)
        : undefined;

    const updated = await updateTableRequest(id, {
      status,
      assignedVendorId:
        body.assignedVendorId !== undefined
          ? body.assignedVendorId
            ? String(body.assignedVendorId)
            : null
          : undefined,
      quoteAmount:
        body.quoteAmount !== undefined
          ? body.quoteAmount == null
            ? null
            : Number(body.quoteAmount)
          : undefined,
      quoteNote:
        body.quoteNote !== undefined
          ? body.quoteNote
            ? String(body.quoteNote)
            : null
          : undefined,
    });

    if (body.note && String(body.note).trim()) {
      await insertTableRequestMessage({
        requestId: id,
        senderId: ctx.userId,
        senderRole: "admin",
        senderName: ctx.profile.fullName?.trim() || "Kay admin",
        body: String(body.note).trim(),
      });
    }

    return NextResponse.json({ request: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
