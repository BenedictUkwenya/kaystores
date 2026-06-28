"use client";

import { useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";

/** Applies dark theme inside After Dark; restores light mode when you leave. */
export function AfterDarkThemeEffect() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("after-dark");
    return () => {
      setTheme("standard");
    };
  }, [setTheme]);

  return null;
}
