import { NextResponse } from "next/server";
import { nominatimReverse } from "@/lib/maps/nominatim";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required." }, { status: 400 });
  }

  try {
    const result = await nominatimReverse(lat, lng);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Reverse geocode failed." },
      { status: 502 },
    );
  }
}
