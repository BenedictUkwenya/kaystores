const STEPS = [
  {
    title: "Client asks or buys",
    body: "A gift order, a cake brief or a \"find me this\" request lands here.",
  },
  {
    title: "Kay picks the vendor",
    body: "Gifts go to the product's vendor automatically. Cakes and concierge: you choose.",
  },
  {
    title: "Vendor prices it",
    body: "They tell Kay their price. You add Kay's margin and send the client one quote.",
  },
  {
    title: "Client pays Kay",
    body: "Card or bank transfer. For transfers, check the bank then press \"Mark paid\".",
  },
  {
    title: "Vendor sends to a Kay hub",
    body: "Never straight to the client. You mark it received and check it looks right.",
  },
  {
    title: "Kay delivers",
    body: "Send it out, mark delivered. The vendor gets paid after delivery.",
  },
];

/** Six-step explainer for anyone new to running Kay. */
export function HowKayWorks({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-medium text-kay-fg">
        <span>
          <span className="text-kay-gold">How Kay works</span> · Kay is always the middle-man between
          client and vendor
        </span>
        <span className="text-[11px] text-kay-muted group-open:hidden">Show</span>
        <span className="hidden text-[11px] text-kay-muted group-open:inline">Hide</span>
      </summary>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-xl bg-kay-surface p-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-kay-gold">
              {index + 1}
            </span>
            <p className="mt-2 text-[13px] font-medium text-kay-fg">{step.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
