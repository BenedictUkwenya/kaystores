import type { Metadata } from "next";
import { ComparePageContent } from "@/components/compare/ComparePageContent";

export const metadata: Metadata = {
  title: "Advanced Comparison",
  description:
    "Compare luxury gifts side by side — price, specs, and gifting fit. Search or use Kay AI suggestions.",
};

export default function ComparePage() {
  return <ComparePageContent />;
}
