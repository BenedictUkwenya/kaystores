"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { IconMoon, IconSun } from "@/components/ui/Icons";

/** Toggles light ↔ After Dark across the main Kay storefront. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isAfterDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isAfterDark ? "Switch to light mode" : "Switch to After Dark"}
      title={isAfterDark ? "Light mode" : "After Dark"}
      className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-kay-border/70 text-kay-fg transition-[border-color,background-color,color] duration-300 hover:border-kay-gold/50 hover:bg-kay-surface ${className}`}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
          isAfterDark
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-2 scale-75 opacity-0"
        }`}
        aria-hidden={!isAfterDark}
      >
        <IconSun className="h-[17px] w-[17px] text-kay-gold" />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
          isAfterDark
            ? "translate-y-2 scale-75 opacity-0"
            : "translate-y-0 scale-100 opacity-100"
        }`}
        aria-hidden={isAfterDark}
      >
        <IconMoon className="h-[17px] w-[17px] opacity-80" />
      </span>
    </button>
  );
}
