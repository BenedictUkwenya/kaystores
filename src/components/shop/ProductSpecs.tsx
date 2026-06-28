type ProductSpecsProps = {
  specs: Record<string, string>;
};

export function ProductSpecs({ specs }: ProductSpecsProps) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <section className="mt-16 border-t border-kay-border-light pt-12">
      <h2 className="font-serif text-[24px] text-kay-fg">
        Gift Details
      </h2>
      <dl className="mt-6 overflow-hidden rounded-xl border border-kay-border">
        {entries.map(([key, value], i) => (
          <div
            key={key}
            className={`grid grid-cols-2 gap-4 px-5 py-4 text-[13px] sm:grid-cols-[200px_1fr] ${
              i % 2 === 0 ? "bg-kay-surface" : "bg-kay-surface-elevated"
            }`}
          >
            <dt className="font-medium text-kay-fg">{key}</dt>
            <dd className="text-kay-muted">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
