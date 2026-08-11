import { GiftRevealPage } from "@/components/reveal/GiftRevealPage";

type Props = { params: Promise<{ token: string }> };

export default async function RevealRoutePage({ params }: Props) {
  const { token } = await params;
  return <GiftRevealPage token={token} />;
}
