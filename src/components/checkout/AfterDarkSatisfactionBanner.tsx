import { IconShield } from "@/components/ui/Icons";

export function AfterDarkSatisfactionBanner() {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[#141414] px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ad-amber/25 bg-ad-amber/10 text-ad-amber">
          <IconShield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white">
            Discreet satisfaction guarantee
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">
            Neutral packaging, confidential support, and private returns handling
            on eligible items.
          </p>
        </div>
      </div>
    </div>
  );
}
