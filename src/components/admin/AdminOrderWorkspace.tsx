"use client";

import { useState } from "react";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { OrderSupportChat } from "@/components/orders/OrderSupportChat";

type Props = {
  orderId: string;
  paymentStatus?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  isGift?: boolean;
  details: React.ReactNode;
};

export function AdminOrderWorkspace({
  orderId,
  paymentStatus,
  trackingNumber,
  trackingCarrier,
  isGift,
  details,
}: Props) {
  const [tab, setTab] = useState<"details" | "support">("details");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["details", "Order details"],
            ["support", "Product support"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === id
                ? "bg-kay-fg text-kay-accent-fg"
                : "border border-kay-border text-kay-muted hover:border-kay-fg hover:text-kay-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {details}
          <AdminOrderActions
            orderId={orderId}
            paymentStatus={paymentStatus}
            trackingNumber={trackingNumber}
            trackingCarrier={trackingCarrier}
            isGift={isGift}
          />
        </div>
      ) : (
        <OrderSupportChat orderId={orderId} viewerRole="admin" />
      )}
    </div>
  );
}
