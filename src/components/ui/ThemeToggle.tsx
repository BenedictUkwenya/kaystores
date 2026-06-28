"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { IconMoon, IconSun } from "@/components/ui/Icons";

export function ThemeToggle() {
  const { isAfterDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isAfterDark ? "Switch to light mode" : "Switch to After Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-kay-fg transition-colors hover:bg-kay-surface"
    >
      {isAfterDark ? <IconSun className="opacity-80" /> : <IconMoon className="opacity-80" />}
    </button>
  );
}
