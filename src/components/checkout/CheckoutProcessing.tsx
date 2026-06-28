type Props = {
  orderNumber?: string;
  isPrivate?: boolean;
};

export function CheckoutProcessing({ orderNumber, isPrivate }: Props) {
  return (
    <div
      className={`mx-auto max-w-lg py-20 text-center ${
        isPrivate ? "text-white" : ""
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${
          isPrivate
            ? "border-ad-amber/30 bg-ad-amber/10"
            : "border-kay-gold/30 bg-kay-gold-light/40"
        }`}
      >
        <span
          className={`h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${
            isPrivate ? "border-ad-amber" : "border-kay-gold"
          }`}
          aria-hidden
        />
      </div>
      <p
        className={`mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] ${
          isPrivate ? "text-ad-amber/90" : "text-kay-gold"
        }`}
      >
        {isPrivate ? "Private processing" : "Processing"}
      </p>
      <h2 className="mt-3 font-serif text-[32px] text-kay-fg sm:text-[36px]">
        {isPrivate ? "Securing your private order" : "Confirming your order"}
      </h2>
      <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-kay-muted">
        {orderNumber
          ? isPrivate
            ? `Reference ${orderNumber} is being confirmed discreetly. Redirecting…`
            : `Order ${orderNumber} is being confirmed. You'll be redirected in a moment.`
          : "Please wait while we secure your order and prepare your confirmation."}
      </p>
      <p className="mt-8 text-[12px] text-kay-subtle">Do not close this page.</p>
    </div>
  );
}
