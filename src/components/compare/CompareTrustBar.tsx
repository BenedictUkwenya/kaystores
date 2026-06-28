import { IconPackage, IconShield, IconTruck } from "@/components/ui/Icons";

const TRUST_ITEMS = [
  {
    icon: IconTruck,
    title: "Complimentary delivery",
    description: "On orders over ₦100,000",
  },
  {
    icon: IconShield,
    title: "Quality assured",
    description: "Every gift hand-checked before dispatch",
  },
  {
    icon: IconPackage,
    title: "Luxury packaging",
    description: "Kay signature wrapping included",
  },
] as const;

export function CompareTrustBar() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
        <div key={title} className="compare-trust-card flex items-start gap-4 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kay-border-light bg-kay-surface text-kay-gold">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-kay-fg">{title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
