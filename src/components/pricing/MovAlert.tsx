import type { OrderPricing } from "@/lib/pricing/calculate";
import Link from "next/link";
import { formatNaira } from "@/lib/data/home";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { DISCREET_SEGMENT_LABEL } from "@/lib/after-dark/checkout-privacy";

type MovAlertProps = {
  pricing: OrderPricing;
  discreet?: boolean;
};

function formatMovMessage(message: string, discreet: boolean) {
  if (!discreet) return message;
  return message.replace(
    `${PRICING_CONFIG.after_dark.label}:`,
    `${DISCREET_SEGMENT_LABEL}:`,
  );
}

export function MovAlert({ pricing, discreet = false }: MovAlertProps) {
  if (pricing.canCheckout || pricing.movErrors.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5"
      role="alert"
    >
      <p className="text-[13px] font-semibold text-amber-950">
        Minimum order not met
      </p>
      <ul className="mt-2 space-y-1.5">
        {pricing.movErrors.map((msg) => (
          <li key={msg} className="text-[12px] leading-relaxed text-amber-900/90">
            {formatMovMessage(msg, discreet)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-amber-800/80">
        Gifting from {formatNaira(PRICING_CONFIG.gifting.mov)} ·{" "}
        {discreet ? DISCREET_SEGMENT_LABEL : "After Dark"} from{" "}
        {formatNaira(PRICING_CONFIG.after_dark.mov)}.{" "}
        <Link
          href={discreet ? "/after-dark" : "/gifts"}
          className="font-medium underline"
        >
          {discreet ? "Add more selections" : "Add more gifts"}
        </Link>
      </p>
    </div>
  );
}
