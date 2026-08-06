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
                Card payment
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
            <p className="mt-1 text-[12px] text-kay-muted">
              Pay securely via Flutterwave after you place your order.
            </p>
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
                Bank transfer
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-medium text-sky-700">
                Flutterwave
              </span>
            </div>
            <p className="mt-1 text-[12px] text-kay-muted">
              Transfer or USSD options on the Flutterwave checkout page.
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
