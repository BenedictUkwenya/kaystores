"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isTributeActive, isTributeHiddenRoute } from "@/lib/tribute";

/**
 * True once mounted, inside the tribute window, on a public shop route.
 * Starts false so server and first client render match.
 */
export function useTributeActive(): boolean {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => setActive(isTributeActive());
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return active && !isTributeHiddenRoute(pathname);
}
