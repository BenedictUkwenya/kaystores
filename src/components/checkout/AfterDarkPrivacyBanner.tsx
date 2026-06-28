import { IconLock, IconShield } from "@/components/ui/Icons";

const PRIVACY_POINTS = [
  "Plain, unmarked packaging — no product names on the outside",
  "Confirmations reference a private code only, never item titles",
  "Delivery details are used solely to fulfil your order",
  "We do not sell, share, or use your data for marketing",
] as const;

export function AfterDarkPrivacyBanner() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111111] p-5 text-white sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ad-amber/30 bg-ad-amber/10 text-ad-amber">
          <IconLock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ad-amber/90">
            Confidential handling
          </p>
          <h2 className="mt-1 font-serif text-[22px] leading-tight text-white">
            This checkout is private
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">
            Your selections stay between you and our discreet fulfilment team.
            Nothing here is published, profiled, or used for advertising.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
        {PRIVACY_POINTS.map((point) => (
          <li
            key={point}
            className="flex gap-2.5 text-[12px] leading-relaxed text-white/70"
          >
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ad-amber/80" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
