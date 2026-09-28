import { NextResponse, after } from "next/server";
import { apiErrorResponse, getAuthContext } from "@/lib/auth/roles";
import { getOrder } from "@/lib/orders/store";
import {
  insertOrderSupportMessage,
  listOrderSupportMessages,
  listOrderVendorContacts,
  vendorHasOrder,
} from "@/lib/orders/support";
import { notifyOrderChatMessage } from "@/lib/email/chat";
import {
  parseChatChannel,
  type ChatChannel,
  type OrderSupportRole,
} from "@/types/order-support";
import type { Order } from "@/types/order";

type Access = {
  role: OrderSupportRole;
  name: string;
  userId: string | null;
  order: Order;
};

async function resolveAccess(orderId: string): Promise<Access> {
  const order = await getOrder(orderId);
  if (!order) {
    return Promise.reject(
      Object.assign(new Error("Order not found."), { status: 404 }),
    );
  }

  const ctx = await getAuthContext();

  if (ctx?.profile.role === "admin") {
    return {
      role: "admin",
      name: ctx.profile.fullName?.trim() || "Kay admin",
      userId: ctx.userId,
      order,
    };
  }

  if (ctx?.vendor && (await vendorHasOrder(ctx.vendor.id, orderId))) {
    return {
      role: "vendor",
      name: ctx.vendor.businessName || ctx.profile.fullName || "Vendor",
      userId: ctx.userId,
      order,
    };
  }

  if (ctx && order.userId && order.userId === ctx.userId) {
    return {
      role: "customer",
      name: ctx.profile.fullName?.trim() || order.buyer.fullName || "Customer",
      userId: ctx.userId,
      order,
    };
  }

  // Anyone with the order link can message Kay (same as viewing the order).
  return {
    role: "customer",
    name: order.buyer.fullName?.trim() || "Customer",
    userId: ctx?.userId ?? null,
    order,
  };
}

/** Customers only see the customer<->admin line; vendors only vendor<->admin. */
function channelFor(role: OrderSupportRole, requested: unknown): ChatChannel {
  if (role === "vendor") return "vendor";
  if (role === "customer") return "customer";
  return parseChatChannel(requested) ?? "customer";
}

function tableMissing(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return message.includes("order_support_messages") || message.includes("42P01");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await resolveAccess(id);
    const channel = channelFor(
      access.role,
      new URL(request.url).searchParams.get("channel"),
    );
    const messages = await listOrderSupportMessages(id, channel);
    return NextResponse.json({ messages, channel });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json({
        messages: [],
        warning: "Order support is not enabled yet. Run migration 035.",
      });
    }
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return apiErrorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
        { error: "Keep messages under 2,000 characters." },
        { status: 400 },
      );
    }

    const channel = channelFor(access.role, body.channel);
    const message = await insertOrderSupportMessage({
      orderId: id,
      senderId: access.userId,
      senderRole: access.role,
      senderName: access.name,
      body: text,
      channel,
    });

    after(async () => {
      try {
        const vendors =
          access.role === "admin" && channel === "vendor"
            ? await listOrderVendorContacts(id)
            : [];
        await notifyOrderChatMessage({
          orderId: id,
          orderNumber: access.order.orderNumber,
          channel,
          senderRole: access.role,
          senderName: access.name,
          body: text,
          customerEmail: access.order.buyer.email,
          customerName: access.order.buyer.fullName,
          vendors,
        });
      } catch (err) {
        console.error("[order chat notify]", err);
      }
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json(
        {
          error:
            "Order support is not enabled yet. Run migration 035_order_support.sql in Supabase.",
        },
        { status: 503 },
      );
    }
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return apiErrorResponse(err);
  }
}
