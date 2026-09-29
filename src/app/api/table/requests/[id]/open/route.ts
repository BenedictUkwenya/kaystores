import { NextResponse } from "next/server";
import { grantAccess, isValidAccessKey } from "@/lib/orders/access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  if (!isValidAccessKey("table", id, url.searchParams.get("k"))) {
    return NextResponse.redirect(new URL("/table", url.origin));
  }
  const response = NextResponse.redirect(new URL(`/table/request/${id}`, url.origin));
  return grantAccess(response, "table", id);
}
