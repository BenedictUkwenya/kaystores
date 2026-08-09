"use client";

type ManualPaymentConfirmProps = {
  confirmed: boolean;
  onChange: (value: boolean) => void;
  amountLabel?: string;
};

/**
 * Temporary no-gateway checkout: customer confirms they have already paid.
 */
export function ManualPaymentConfirm({
  confirmed,
  onChange,
  amountLabel,
}: ManualPaymentConfirmProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-kay-border bg-kay-surface/60 px-4 py-4 sm:px-5">
        <p className="text-[13px] font-medium text-kay-fg">How to pay</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-kay-muted">
          Complete payment with Kay directly (bank transfer or arrangement). Online
          card checkout is paused for now
          {amountLabel ? (
            <>
              {" "}
              — total due: <span className="font-medium text-kay-fg">{amountLabel}</span>
            </>
          ) : null}
          .
        </p>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all sm:p-5 ${
          confirmed
            ? "border-kay-gold bg-kay-gold-light/30"
            : "border-kay-border hover:border-kay-gold/50"
        }`}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-kay-gold"
        />
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-kay-fg">
            Yes, I have paid
          </span>
          <span className="mt-1 block text-[12px] leading-relaxed text-kay-muted">
            I confirm payment for this order has been sent. Kay may verify before
            fulfilment.
          </span>
        </span>
      </label>
    </div>
  );
}
