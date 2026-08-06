import type { ConciergeRequestStatus } from "@/types/concierge";
import { getConciergeTrackingSteps } from "@/lib/concierge/status";

type Props = {
  status: ConciergeRequestStatus;
};

export function ConciergeStatusTimeline({ status }: Props) {
  const steps = getConciergeTrackingSteps(status);

  return (
    <div className="rounded-lg border border-kay-border-light bg-kay-surface-elevated/40 p-5">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
        Request status
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
              {step.description && (
                <p className="mt-0.5 text-[12px] leading-relaxed text-kay-muted">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
