import { NextResponse } from "next/server";
import { grantOrderAccess, isValidOrderAccessKey } from "@/lib/orders/access";

const ALLOWED_SUFFIX = /^(\/split|\/reveal)?$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const key = url.searchParams.get("k");
  const to = url.searchParams.get("to") ?? "";
  const suffix = ALLOWED_SUFFIX.test(to) ? to : "";

  if (!isValidOrderAccessKey(id, key)) {
    return NextResponse.redirect(new URL("/track-order", url.origin));
  }

  const response = NextResponse.redirect(new URL(`/order/${id}${suffix}`, url.origin));
  return grantOrderAccess(response, id);
}
