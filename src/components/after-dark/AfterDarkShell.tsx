"use client";

import { AfterDarkAgeGate } from "@/components/after-dark/AfterDarkAgeGate";
import { AfterDarkAgeProvider } from "@/components/after-dark/AfterDarkAgeProvider";
import { AfterDarkFooter } from "@/components/after-dark/AfterDarkFooter";
import { AfterDarkHeader } from "@/components/after-dark/AfterDarkHeader";
import { AfterDarkMotionOverride } from "@/components/after-dark/AfterDarkMotionOverride";
import { AfterDarkThemeEffect } from "@/components/after-dark/AfterDarkThemeEffect";
import "@/components/after-dark/after-dark-motion.css";

export function AfterDarkShell({ children }: { children: React.ReactNode }) {
  return (
    <AfterDarkAgeProvider>
      <AfterDarkMotionOverride />
      <AfterDarkThemeEffect />
      <div className="after-dark-experience force-motion min-h-screen bg-black text-white">
        <AfterDarkHeader />
        <main>{children}</main>
        <AfterDarkFooter />
        <AfterDarkAgeGate />
      </div>
    </AfterDarkAgeProvider>
  );
}
