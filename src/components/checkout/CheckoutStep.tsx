type CheckoutStepProps = {
  step: number;
  title: string;
  children: React.ReactNode;
};

export function CheckoutStep({ step, title, children }: CheckoutStepProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kay-gold text-[13px] font-semibold text-white">
          {step}
        </span>
        <h2 className="text-[18px] font-semibold text-kay-fg sm:text-[20px]">
          {title}
        </h2>
      </div>
      <div className="checkout-card rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-6">
        {children}
      </div>
    </section>
  );
}
