import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AfterDarkShell } from "@/components/after-dark/AfterDarkShell";
import { isAfterDarkAgeVerified } from "@/lib/after-dark/age-gate";

export const metadata: Metadata = {
  title: "Kay After Dark — The Intimate Edit",
  description:
    "A discreet 18+ collection of perfumes, silks, and sensual gifts. Mature audiences only. Your discretion is guaranteed.",
  robots: { index: false, follow: false },
};

export default async function AfterDarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ageVerified = isAfterDarkAgeVerified(await cookies());
  return <AfterDarkShell initialAgeVerified={ageVerified}>{children}</AfterDarkShell>;
}
