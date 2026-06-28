import type { Order, OrderTracking } from "@/types/order";
import { getTrackingSteps } from "@/lib/orders/status";

type Props = {
  order: Pick<Order, "status" | "tracking">;
};

export function OrderTrackingTimeline({ order }: Props) {
  const steps = getTrackingSteps(order.status);
  const tracking = order.tracking;

  return (
    <div className="rounded-lg border border-kay-border-light bg-kay-surface-elevated/40 p-5">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
        Delivery status
      </h2>

      <ol className="mt-4 space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                step.complete
                  ? "bg-kay-gold text-white"
                  : step.active
                    ? "border-2 border-kay-gold text-kay-gold"
                    : "border border-kay-border text-kay-subtle"
              }`}
              aria-hidden
            >
              {step.complete ? "✓" : step.active ? "•" : ""}
            </span>
            <div>
              <p
                className={`text-[14px] ${
                  step.active || step.complete
                    ? "font-medium text-kay-fg"
                    : "text-kay-muted"
                }`}
              >
                {step.label}
              </p>
              {step.active && order.status === "pending_handover" && (
                <p className="mt-0.5 text-[12px] text-kay-muted">
                  Waiting for your recipient to share their delivery address.
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <TrackingDetails tracking={tracking} />
    </div>
  );
}

function TrackingDetails({ tracking }: { tracking?: OrderTracking }) {
  if (tracking?.number || tracking?.url) {
    return (
      <div className="mt-5 border-t border-kay-border-light pt-4">
        <p className="text-[12px] text-kay-muted">
          {tracking.carrier && (
            <span className="text-kay-fg">{tracking.carrier}</span>
          )}
          {tracking.carrier && tracking.number && " · "}
          {tracking.number && (
            <span className="font-mono text-kay-fg">{tracking.number}</span>
          )}
        </p>
        {tracking.url && (
          <a
            href={tracking.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[13px] text-kay-gold hover:underline"
          >
            Track shipment →
          </a>
        )}
      </div>
    );
  }

  return (
    <p className="mt-5 border-t border-kay-border-light pt-4 text-[12px] leading-relaxed text-kay-muted">
      Live carrier tracking will appear here once your order ships. Our
      logistics partner integration is being connected — you&apos;ll receive an
      email when tracking is available.
    </p>
  );
}
