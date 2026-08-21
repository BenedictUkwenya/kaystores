import { NextResponse } from "next/server";
import { nominatimSearch } from "@/lib/maps/nominatim";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await nominatimSearch(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Address search failed." },
      { status: 502 },
    );
  }
}
