import type { AddressDetails } from "@/types/order";

export function getDeliveryAddress(order: {
  deliveryType: "self" | "gift";
  buyerAddress?: AddressDetails | null;
  gift?: { recipientAddress?: AddressDetails | null } | null;
  recipientAddress?: AddressDetails | null;
}): AddressDetails | null {
  if (order.deliveryType === "gift") {
    return (
      order.gift?.recipientAddress ??
      order.recipientAddress ??
      null
    );
  }
  return order.buyerAddress ?? null;
}

export function formatAddressLines(address?: AddressDetails | null): string[] {
  if (!address) return [];
  // The typed street wins over the geocoded label — buyers often correct it.
  const street = address.line1?.trim() || address.formattedAddress?.trim();
  return [
    street,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country,
    address.instructions ? `Note: ${address.instructions}` : undefined,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

export function mapsUrl(address?: AddressDetails | null): string | null {
  if (!address) return null;
  if (address.lat != null && address.lng != null) {
    return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
  }
  const query = formatAddressLines({ ...address, instructions: undefined }).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
