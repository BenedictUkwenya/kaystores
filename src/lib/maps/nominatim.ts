import type { AddressDetails } from "@/types/order";

export type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state?: string;
    state_district?: string;
    postcode?: string;
    country?: string;
  };
};

const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "KayStores/1.0 (https://www.shoponkay.com; checkout-address)";

export async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "ng");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Address search failed.");
  return (await res.json()) as NominatimResult[];
}

export async function nominatimReverse(
  lat: number,
  lng: number,
): Promise<NominatimResult | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult & { error?: string };
  if (data.error) return null;
  return data;
}

export function nominatimToAddress(
  result: NominatimResult,
  fallback: AddressDetails,
): AddressDetails {
  const a = result.address ?? {};
  const line1 =
    [a.house_number, a.road || a.pedestrian].filter(Boolean).join(" ") ||
    a.neighbourhood ||
    a.suburb ||
    result.display_name.split(",")[0]?.trim() ||
    fallback.line1;

  const city =
    a.city ||
    a.town ||
    a.village ||
    a.city_district ||
    a.suburb ||
    a.county ||
    fallback.city;

  const state = a.state || a.state_district || fallback.state;
  const postalCode = a.postcode || fallback.postalCode;
  const country = a.country || fallback.country || "Nigeria";

  return {
    ...fallback,
    line1,
    city,
    state,
    postalCode: postalCode || undefined,
    country,
    lat: Number(result.lat),
    lng: Number(result.lon),
    placeId: String(result.place_id),
    formattedAddress: result.display_name,
  };
}

/** Parse coords from pasted Google Maps / Apple Maps / geo links. */
export function parseLocationFromText(input: string): {
  lat: number;
  lng: number;
} | null {
  const text = input.trim();
  if (!text) return null;

  // @6.5244,3.3792,17z or @6.5244,3.3792
  const at = /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/.exec(text);
  if (at) {
    return { lat: Number(at[1]), lng: Number(at[2]) };
  }

  // ?q=6.5244,3.3792 or q=6.5244+3.3792
  const q = /[?&]q=(-?\d+\.?\d*)[,+\s]+(-?\d+\.?\d*)/i.exec(text);
  if (q) {
    return { lat: Number(q[1]), lng: Number(q[2]) };
  }

  // !3d6.5244!4d3.3792 (Google place)
  const bang = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/.exec(text);
  if (bang) {
    return { lat: Number(bang[1]), lng: Number(bang[2]) };
  }

  // plain "6.5244, 3.3792"
  const plain = /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/.exec(text);
  if (plain) {
    return { lat: Number(plain[1]), lng: Number(plain[2]) };
  }

  return null;
}
