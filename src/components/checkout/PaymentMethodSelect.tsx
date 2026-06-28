"use client";

type PaymentMethod = "card" | "bank";

type PaymentMethodSelectProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

export function PaymentMethodSelect({
  value,
  onChange,
}: PaymentMethodSelectProps) {
  return (
    <div className="space-y-3">
      <label
        className={`block cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
          value === "card"
            ? "border-kay-gold bg-kay-gold-light/30"
            : "border-kay-border hover:border-kay-gold/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="payment"
            checked={value === "card"}
            onChange={() => onChange("card")}
            className="mt-1 accent-kay-gold"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-kay-fg">
                Credit or Debit Card
              </span>
              <span className="flex gap-1 text-[10px] font-bold tracking-wide text-kay-subtle">
                <span className="rounded border border-kay-border px-1.5 py-0.5">
                  VISA
                </span>
                <span className="rounded border border-kay-border px-1.5 py-0.5">
                  MC
                </span>
              </span>
            </div>

            {value === "card" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[12px] font-medium text-kay-muted">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    disabled
                    className="h-11 w-full rounded-lg border border-kay-border bg-kay-surface px-3.5 text-[14px] text-kay-subtle"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-kay-muted">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    disabled
                    className="h-11 w-full rounded-lg border border-kay-border bg-kay-surface px-3.5 text-[14px] text-kay-subtle"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-kay-muted">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    disabled
                    className="h-11 w-full rounded-lg border border-kay-border bg-kay-surface px-3.5 text-[14px] text-kay-subtle"
                  />
                </div>
                <p className="sm:col-span-2 text-[11px] text-kay-subtle">
                  Payment processing coming soon — your order will be confirmed
                  on submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </label>

      <label
        className={`block cursor-pointer rounded-xl border-2 p-4 transition-all sm:p-5 ${
          value === "bank"
            ? "border-kay-gold bg-kay-gold-light/30"
            : "border-kay-border hover:border-kay-gold/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="payment"
            checked={value === "bank"}
            onChange={() => onChange("bank")}
            className="mt-1 accent-kay-gold"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-kay-fg">
                Bank Transfer
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-medium text-sky-700">
                Secure
              </span>
            </div>
            <p className="mt-1 text-[12px] text-kay-muted">
              Pay via transfer — details sent after order confirmation.
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
