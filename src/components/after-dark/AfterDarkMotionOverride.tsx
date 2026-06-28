"use client";

import { useEffect } from "react";

/** Forces animations on After Dark pages, overriding OS prefers-reduced-motion. */
export function AfterDarkMotionOverride() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ad-force-motion");
    root.style.scrollBehavior = "smooth";

    return () => {
      root.classList.remove("ad-force-motion");
      root.style.scrollBehavior = "";
    };
  }, []);

  return null;
}
