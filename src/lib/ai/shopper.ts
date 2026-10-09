import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AddressDetails } from "@/types/order";

export type ShopperContext = {
  signedIn: boolean;
  firstName: string | null;
  places: string[];
  pastOrders: { items: string[]; place: string | null }[];
  orders: { number: string; status: string; items: string }[];
};

export type VendorPlace = {
  businessName: string;
  place: string | null;
};

function firstName(fullName: string | null | undefined): string | null {
  const name = fullName?.trim().split(/\s+/)[0];
  return name || null;
}

function placeLabel(address: AddressDetails | null | undefined): string | null {
  if (!address) return null;
  const place = [address.city, address.state].filter(Boolean).join(", ");
  return place || null;
}

export async function loadShopperContext(): Promise<ShopperContext> {
  const empty: ShopperContext = {
    signedIn: false,
    firstName: null,
    places: [],
    pastOrders: [],
    orders: [],
  };
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return empty;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: orderRows } = await supabase
      .from("orders")
      .select(
        "order_number, status, items, buyer_address, gift, recipient_address, delivery_type, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5);

    const pastOrders: ShopperContext["pastOrders"] = [];
    const orders: ShopperContext["orders"] = [];
    const places = new Set<string>();

    for (const row of orderRows ?? []) {
      const items = Array.isArray(row.items)
        ? row.items
            .map((item) =>
              item && typeof item === "object" && "name" in item
                ? String((item as { name?: string }).name ?? "")
                : "",
            )
            .filter(Boolean)
            .slice(0, 3)
        : [];
      const gift = row.gift as { recipientAddress?: AddressDetails } | null;
      const address =
        row.delivery_type === "gift"
          ? gift?.recipientAddress ??
            (row.recipient_address as AddressDetails | null)
          : (row.buyer_address as AddressDetails | null);
      const place = placeLabel(address);
      if (place) places.add(place);
      if (items.length) pastOrders.push({ items, place });
      orders.push({
        number: String(row.order_number ?? ""),
        status: String(row.status ?? ""),
        items: items.join(", "),
      });
    }

    return {
      signedIn: true,
      firstName: firstName(
        profile?.full_name ?? (user.user_metadata?.full_name as string | undefined),
      ),
      places: [...places],
      pastOrders,
      orders,
    };
  } catch {
    return empty;
  }
}

export async function loadVendorPlaces(
  vendorIds: string[],
): Promise<Map<string, VendorPlace>> {
  const map = new Map<string, VendorPlace>();
  const ids = [...new Set(vendorIds.filter(Boolean))];
  if (!ids.length) return map;

  const admin = createAdminClient();
  if (!admin) return map;

  const { data } = await admin
    .from("vendors")
    .select("id, business_name, pickup_address, status")
    .in("id", ids);

  for (const row of data ?? []) {
    if (row.status !== "approved") continue;
    const address = row.pickup_address as AddressDetails | null;
    map.set(String(row.id), {
      businessName: String(row.business_name ?? ""),
      place: placeLabel(address),
    });
  }
  return map;
}
