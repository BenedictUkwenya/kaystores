"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { IconLock } from "@/components/ui/Icons";

/**
 * Discreet After Dark entry — only appears in dark mode on the main storefront.
 * Hidden on /after-dark routes and in light mode.
 */
export function AfterDarkDiscreetStrip() {
  const { isAfterDark } = useTheme();
  const pathname = usePathname();

  if (!isAfterDark || pathname.startsWith("/after-dark")) {
    return null;
  }

  return (
    <div className="border-b border-kay-gold/15 bg-gradient-to-r from-transparent via-kay-surface/80 to-transparent">
      <div className="mx-auto flex max-w-[1440px] justify-center px-8 py-2 sm:px-12 lg:px-16 xl:px-20">
        <Link
          href="/after-dark"
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
