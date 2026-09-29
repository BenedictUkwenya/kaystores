"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClearFiltersLink({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/gifts";
  return (
    <Link href={pathname} className={className}>
      Clear filters
    </Link>
  );
}
