import { NextResponse } from "next/server";
import { getTableProducts } from "@/lib/products/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 24);

  const result = await getTableProducts({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 24,
    sort: "random",
    filters: tag ? { tags: [tag] } : undefined,
  });

  return NextResponse.json(result);
}
