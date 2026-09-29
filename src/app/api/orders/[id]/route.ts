import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders/store";
import { resolveOrderViewer } from "@/lib/orders/access";

type RouteContext = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const order = await getOrder(id);
  const key = new URL(request.url).searchParams.get("k");

  if (!order || !(await resolveOrderViewer(order, key))) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { handoverToken: _handover, ...safe } = order as typeof order & {
    handoverToken?: string | null;
  };
  void _handover;
  return NextResponse.json(safe);
}
