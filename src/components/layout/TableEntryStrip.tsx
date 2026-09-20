"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Warm Kay Table entry on the main storefront — always visible except on /table.
 */
export function TableEntryStrip() {
  const pathname = usePathname();
  if (pathname.startsWith("/table") || pathname.startsWith("/after-dark")) {
    return null;
  }

  return (
    <div className="border-b border-[#4a2f24]/10 bg-gradient-to-r from-[#faf6f0] via-[#f3ebe1] to-[#faf6f0]">
      <div className="mx-auto flex max-w-[1440px] justify-center px-8 py-2 sm:px-12 lg:px-16 xl:px-20">
        <Link
          href="/table"
          className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#6b4536]/80 transition-colors hover:text-[#4a2f24]"
        >
          <span>Kay Table</span>
          <span className="h-px w-4 bg-[#6b4536]/30 transition-all group-hover:w-6 group-hover:bg-[#4a2f24]/50" />
          <span className="text-[#6e5e54] transition-colors group-hover:text-[#4a2f24]">
            Edible gifts
          </span>
        </Link>
      </div>
    </div>
  );
}
