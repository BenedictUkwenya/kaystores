"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { IconMoon, IconSun } from "@/components/ui/Icons";

/** Toggles light ↔ dark theme across the main Kay storefront. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isAfterDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isAfterDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isAfterDark ? "Light mode" : "Dark mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-kay-fg transition-all hover:border-kay-border hover:bg-kay-surface ${className}`}
    >
      {isAfterDark ? (
        <IconSun className="h-[17px] w-[17px] text-kay-gold opacity-90" />
      ) : (
        <IconMoon className="h-[17px] w-[17px] opacity-75" />
      )}
    </button>
  );
}
