"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { IconLock } from "@/components/ui/Icons";

/**
 * Discreet After Dark entry — visible in dark mode on the main storefront.
 * Soft height/opacity transition when leaving dark mode (no hard cut).
 */
export function AfterDarkDiscreetStrip() {
  const { isAfterDark } = useTheme();
  const pathname = usePathname();
  const onAfterDarkRoute = pathname.startsWith("/after-dark");
  const show = isAfterDark && !onAfterDarkRoute;

  if (onAfterDarkRoute) return null;

  return (
    <div
      className={`kay-ad-strip overflow-hidden border-kay-gold/15 bg-gradient-to-r from-transparent via-kay-surface/80 to-transparent transition-[max-height,opacity,border-color] duration-500 ease-out ${
        show
          ? "max-h-12 border-b opacity-100"
          : "pointer-events-none max-h-0 border-b-0 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-[1440px] justify-center px-8 py-2 sm:px-12 lg:px-16 xl:px-20">
        <Link
          href="/after-dark"
          tabIndex={show ? 0 : -1}
          className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-kay-gold/75 transition-colors hover:text-kay-gold"
        >
          <IconLock className="h-3 w-3 shrink-0 opacity-70" />
          <span>The intimate edit</span>
          <span className="h-px w-4 bg-kay-gold/30 transition-all group-hover:w-6 group-hover:bg-kay-gold/60" />
          <span className="text-kay-subtle transition-colors group-hover:text-kay-gold/90">
            18+
          </span>
        </Link>
      </div>
    </div>
  );
}
