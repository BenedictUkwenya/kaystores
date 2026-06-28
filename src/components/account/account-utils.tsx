import type { OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    confirmed: "bg-kay-gold-light/80 text-[#8a7348] border-kay-gold/25",
    pending_handover: "bg-amber-50 text-amber-800 border-amber-200/60",
    processing: "bg-kay-beta-bg text-kay-beta border-kay-gold/20",
    shipped: "bg-sky-50 text-sky-800 border-sky-200/60",
    delivered: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function formatMemberSince(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
