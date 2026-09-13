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
  if (address.formattedAddress?.trim()) {
    const extras = [address.country].filter(
      (part) => part && !address.formattedAddress!.includes(part),
    );
    return [address.formattedAddress.trim(), ...extras];
  }

  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

export function mapsUrl(address?: AddressDetails | null): string | null {
  if (!address) return null;
  if (address.lat != null && address.lng != null) {
    return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
  }
  const query = formatAddressLines(address).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
