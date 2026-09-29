"use client";

import { RelayChat } from "@/components/chat/RelayChat";

type Props = {
  orderId: string;
  viewerRole: "admin" | "vendor" | "customer";
  vendorThreads?: { id: string; name: string }[];
};

const DESCRIPTIONS = {
  customer: "Message Kay about this order — delivery, the product, or a change.",
  vendor: "Message the Kay team about this order. Kay relays anything to and from the customer.",
  admin: "Two private lines — the customer and the vendor never see each other's messages. Relay what's needed.",
} as const;

export function OrderSupportChat({ orderId, viewerRole }: Props) {
  return (
    <RelayChat
      apiBase={`/api/orders/${orderId}/support`}
      viewerRole={viewerRole}
      title="Order support"
      description={DESCRIPTIONS[viewerRole]}
      emptyText="No messages yet. Ask about the product, address, or fulfilment here."
      customerLabel="Customer"
      vendorLabel="Vendor"
      minHeight="min-h-[420px]"
    />
  );
}
