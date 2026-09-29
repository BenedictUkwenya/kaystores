"use client";

import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "@/providers/ThemeProvider";

/** Applies After Dark theme while in this section; restores the prior theme on exit. */
export function AfterDarkThemeEffect() {
  const { theme, setTheme } = useTheme();
  const previous = useRef<Theme | null>(null);

  useEffect(() => {
    previous.current = theme;
    setTheme("after-dark");
    return () => {
      const restore = previous.current;
      if (restore && restore !== "after-dark") {
        setTheme(restore);
      } else {
        setTheme("standard");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture entry theme once
  }, [setTheme]);

  return null;
}
