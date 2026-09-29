"use client";

import { useState } from "react";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { OrderSupportChat } from "@/components/orders/OrderSupportChat";

type Props = {
  orderId: string;
  paymentStatus?: string;
  paymentReference?: string;
  orderStatus: string;
  allItemsQcPassed: boolean;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  isGift?: boolean;
  vendorThreads?: { id: string; name: string }[];
  details: React.ReactNode;
};

export function AdminOrderWorkspace({ details, vendorThreads, ...actions }: Props) {
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
          <AdminOrderActions {...actions} />
        </div>
      ) : (
        <OrderSupportChat
          orderId={actions.orderId}
          viewerRole="admin"
          vendorThreads={vendorThreads}
        />
      )}
    </div>
  );
}
