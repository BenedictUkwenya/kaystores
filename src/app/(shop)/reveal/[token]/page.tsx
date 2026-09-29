import type { Metadata } from "next";
import { GiftRevealPage } from "@/components/reveal/GiftRevealPage";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function RevealRoutePage({ params }: Props) {
  const { token } = await params;
  return <GiftRevealPage token={token} />;
}
