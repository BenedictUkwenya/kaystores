import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountOrders } from "@/lib/orders/store";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const orders = await getAccountOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Could not load orders." },
      { status: 500 },
    );
  }
}
