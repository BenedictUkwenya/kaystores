import { NextResponse, after } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import {
  getTableRequestById,
  insertTableRequestMessage,
  listTableRequestMessages,
} from "@/lib/table/repository";
import { notifyKitchenChatMessage } from "@/lib/email/chat";
import { resolveTableViewer } from "@/lib/orders/access";
import { parseChatChannel, type ChatChannel } from "@/types/order-support";
import type { TableRequest, TableSenderRole } from "@/types/table";

type Access = {
  role: TableSenderRole;
  name: string;
  userId: string | null;
  request: TableRequest;
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
      request,
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
      request,
    };
  }

  if (ctx && request.userId && request.userId === ctx.userId) {
    return {
      role: "customer",
      name: ctx.profile.fullName?.trim() || request.contactName || "Customer",
      userId: ctx.userId,
      request,
    };
  }

  if (!ctx?.vendor && (await resolveTableViewer(request))) {
    return {
      role: "customer",
      name: request.contactName?.trim() || "Customer",
      userId: ctx?.userId ?? null,
      request,
    };
  }

  return Promise.reject(
    Object.assign(new Error("Request not found."), { status: 404 }),
  );
}

/** Customers only see the customer<->admin line; vendors only vendor<->admin. */
function channelFor(role: TableSenderRole, requested: unknown): ChatChannel {
  if (role === "vendor") return "vendor";
  if (role === "customer") return "customer";
  return parseChatChannel(requested) ?? "customer";
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

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const access = await resolveAccess(id);
    const channel = channelFor(
      access.role,
      new URL(request.url).searchParams.get("channel"),
    );
    const messages = await listTableRequestMessages(id, channel);
    return NextResponse.json({ messages, channel });
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
    const body = (await request.json()) as { body?: string; channel?: string };
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

    const channel = channelFor(access.role, body.channel);
    if (channel === "vendor" && !access.request.assignedVendorId) {
      return NextResponse.json(
        { error: "Assign a baker before messaging them." },
        { status: 400 },
      );
    }

    const message = await insertTableRequestMessage({
      requestId: id,
      senderId: access.userId,
      senderRole: access.role,
      senderName: access.name,
      body: text,
      channel,
    });

    after(() =>
      notifyKitchenChatMessage({
        requestId: id,
        reference: access.request.reference,
        channel,
        senderRole: access.role,
        senderName: access.name,
        body: text,
        customerEmail: access.request.contactEmail,
        customerName: access.request.contactName,
        assignedVendorId: access.request.assignedVendorId ?? null,
      }).catch((err) => console.error("[kitchen chat notify]", err)),
    );

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
