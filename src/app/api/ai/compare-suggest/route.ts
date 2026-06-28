import { NextResponse } from "next/server";
import { getProducts, getProductBySlug } from "@/lib/products/queries";
import { suggestCompareProducts } from "@/lib/ai/suggest-compare";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required." },
        { status: 400 },
      );
    }

    const anchor = await getProductBySlug(slug);
    if (!anchor) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const result = await suggestCompareProducts(anchor);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not generate compare suggestions." },
      { status: 500 },
    );
  }
}
