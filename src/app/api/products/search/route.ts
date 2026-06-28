import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const exclude = searchParams.get("exclude")?.split(",").filter(Boolean) ?? [];

    if (!q) {
      return NextResponse.json({ products: [] });
    }

    const { products } = await getProducts({
      filters: { search: q },
      pageSize: 8,
    });

    const filtered = products.filter((product) => !exclude.includes(product.slug));
    return NextResponse.json({ products: filtered });
  } catch {
    return NextResponse.json(
      { error: "Search failed." },
      { status: 500 },
    );
  }
}
