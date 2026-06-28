import { IconDiamond, IconShield } from "@/components/ui/Icons";

const PERKS = [
  "Global network of verified luxury boutiques & makers",
  "Concierge fees applied only upon successful procurement",
  "White-glove delivery and insurance on sourced items",
] as const;

export function ConciergeSidebar() {
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <IconShield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-sky-900">
              Expert verification
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-sky-800/80">
              All sourced items are authenticated before delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#111111] p-5 text-white sm:p-6">
        <div className="flex items-center gap-2">
          <IconDiamond className="h-4 w-4 text-[#b89a6a]" />
          <h3 className="font-serif text-[16px]">Premium perks</h3>
        </div>
        <ul className="mt-4 space-y-3">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex gap-2.5 text-[12px] leading-relaxed text-white/75"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b89a6a]" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <div className="concierge-card rounded-xl border border-kay-border-light px-4 py-4 shadow-sm">
        <h3 className="text-[13px] font-semibold text-kay-fg">Request status</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-kay-muted">
          Submit a request to begin. We&apos;ll email you updates at each stage.
        </p>
      </div>

      <div className="concierge-card rounded-xl border border-kay-border-light px-4 py-4 shadow-sm">
        <h3 className="text-[13px] font-semibold text-kay-fg">Need help?</h3>
        <p className="mt-1 text-[12px] text-kay-muted">
          For urgent or high-value requests, reach our team directly.
        </p>
        <a
          href="mailto:concierge@kaystores.com"
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-kay-border text-[13px] font-medium text-kay-fg transition-colors hover:border-kay-fg hover:bg-kay-surface"
        >
          Email Concierge
        </a>
      </div>
    </aside>
  );
}
