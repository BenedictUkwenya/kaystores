import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  pending_handover: "Awaiting recipient",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const TRACKING_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "confirmed", label: "Order confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function statusRank(status: OrderStatus): number {
  if (status === "pending_handover") return 0;
  if (status === "confirmed") return 1;
  if (status === "processing") return 2;
  if (status === "shipped") return 3;
  return 4;
}

export function getTrackingSteps(status: OrderStatus) {
  const current = statusRank(status);
  return TRACKING_STEPS.map((step, index) => ({
    ...step,
    complete: current > index + 1 || (status === "delivered" && index < 4),
    active:
      (status === "pending_handover" && index === 0) ||
      (status === "confirmed" && index === 0) ||
      (status === "processing" && index === 1) ||
      (status === "shipped" && index === 2) ||
      (status === "delivered" && index === 3),
  }));
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
