"use client";

import { Suspense } from "react";
import { AfterDarkAgeGate } from "@/components/after-dark/AfterDarkAgeGate";
import { AfterDarkAgeProvider } from "@/components/after-dark/AfterDarkAgeProvider";
import { AfterDarkFooter } from "@/components/after-dark/AfterDarkFooter";
import { AfterDarkHeader } from "@/components/after-dark/AfterDarkHeader";
import { AfterDarkThemeEffect } from "@/components/after-dark/AfterDarkThemeEffect";
import "@/components/after-dark/after-dark-motion.css";

function AfterDarkShellInner({
  children,
  initialAgeVerified,
}: {
  children: React.ReactNode;
  initialAgeVerified: boolean;
}) {
  return (
    <AfterDarkAgeProvider initialVerified={initialAgeVerified}>
      <AfterDarkThemeEffect />
      <div className="after-dark-experience min-h-screen bg-black text-white">
        <AfterDarkHeader />
        <main>{children}</main>
        <AfterDarkFooter />
        <AfterDarkAgeGate />
      </div>
    </AfterDarkAgeProvider>
  );
}

export function AfterDarkShell({
  children,
  initialAgeVerified = false,
}: {
  children: React.ReactNode;
  initialAgeVerified?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="after-dark-experience min-h-screen bg-black text-white">
          <AfterDarkHeader />
          <main>{children}</main>
          <AfterDarkFooter />
        </div>
      }
    >
      <AfterDarkShellInner initialAgeVerified={initialAgeVerified}>
        {children}
      </AfterDarkShellInner>
    </Suspense>
  );
}
