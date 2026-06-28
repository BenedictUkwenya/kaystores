import { NextResponse } from "next/server";
import { getProductsBySlugs } from "@/lib/products/queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slugs?: string[] };
    const slugs = Array.isArray(body.slugs) ? body.slugs : [];

    const products = await getProductsBySlugs(slugs);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 },
    );
  }
}
