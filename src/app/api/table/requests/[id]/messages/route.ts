import { NextResponse } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import {
  getTableRequestById,
  insertTableRequestMessage,
  listTableRequestMessages,
} from "@/lib/table/repository";
import type { TableSenderRole } from "@/types/table";

type Access = {
  role: TableSenderRole;
  name: string;
  userId: string | null;
};

async function resolveAccess(requestId: string): Promise<Access> {
  const request = await getTableRequestById(requestId);
  if (!request) {
    return Promise.reject(
      Object.assign(new Error("Request not found."), { status: 404 }),
    );
  }

  const ctx = await getAuthContext();

  if (ctx?.profile.role === "admin") {
    return {
      role: "admin",
      name: ctx.profile.fullName?.trim() || "Kay admin",
      userId: ctx.userId,
    };
  }

  if (
    ctx?.vendor &&
    request.assignedVendorId &&
    ctx.vendor.id === request.assignedVendorId
  ) {
    return {
      role: "vendor",
      name: ctx.vendor.businessName || ctx.profile.fullName || "Baker",
      userId: ctx.userId,
    };
  }

  if (ctx && request.userId && request.userId === ctx.userId) {
    return {
      role: "customer",
      name: ctx.profile.fullName?.trim() || request.contactName || "Customer",
      userId: ctx.userId,
    };
  }

  // Guests with the request link may message (same pattern as order support).
  return {
    role: "customer",
    name: request.contactName?.trim() || "Customer",
    userId: ctx?.userId ?? null,
  };
}

function tableMissing(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return (
    message.includes("table_request_messages") ||
    message.includes("table_requests") ||
    message.includes("42P01")
  );
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await resolveAccess(id);
    const messages = await listTableRequestMessages(id);
    return NextResponse.json({ messages });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json({
        messages: [],
        warning: "Kay Kitchen messaging is not enabled yet. Run migration 036.",
      });
    }
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const access = await resolveAccess(id);
    const body = (await request.json()) as { body?: string };
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      );
    }

    const message = await insertTableRequestMessage({
      requestId: id,
      senderId: access.userId,
      senderRole: access.role,
      senderName: access.name,
      body: text,
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json(
        { error: "Kay Kitchen messaging is not enabled yet. Run migration 036." },
        { status: 503 },
      );
    }
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    return apiErrorResponse(err);
  }
}
