import type { Metadata } from "next";
import { AfterDarkShell } from "@/components/after-dark/AfterDarkShell";

export const metadata: Metadata = {
  title: "Kay After Dark — The Intimate Edit",
  description:
    "A discreet 18+ collection of perfumes, silks, and sensual gifts. Mature audiences only. Your discretion is guaranteed.",
  robots: { index: false, follow: false },
};

export default function AfterDarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AfterDarkShell>{children}</AfterDarkShell>;
}
