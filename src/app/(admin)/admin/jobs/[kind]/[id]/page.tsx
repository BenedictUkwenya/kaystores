import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { isJobKind } from "@/lib/jobs/labels";
import { giftJob } from "@/lib/jobs/gift";
import { kitchenJob } from "@/lib/jobs/kitchen";
import { conciergeJob } from "@/lib/jobs/concierge";
import { loadGiftLines } from "@/lib/jobs";
import { fetchOrderById } from "@/lib/orders/repository";
import { getTableRequestById } from "@/lib/table/repository";
import { fetchConciergeRequestWithAssignments } from "@/lib/concierge/dispatch";
import { getMarkupTiers } from "@/lib/pricing/markup";
import { GiftJobView } from "@/components/jobs/views/GiftJobView";
import { KitchenJobView } from "@/components/jobs/views/KitchenJobView";
import { ConciergeJobView } from "@/components/jobs/views/ConciergeJobView";

type Props = { params: Promise<{ kind: string; id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function AdminJobPage({ params }: Props) {
  await requireAdmin();
  const { kind, id } = await params;
  if (!isJobKind(kind) || !UUID.test(id)) notFound();

  if (kind === "gift") {
    const order = await fetchOrderById(id);
    if (!order) notFound();
    const job = giftJob(order, await loadGiftLines(id));
    return <GiftJobView job={job} order={order} />;
  }

  if (kind === "kitchen") {
    const request = await getTableRequestById(id);
    if (!request) notFound();
    return <KitchenJobView job={kitchenJob(request)} request={request} />;
  }

  const [request, tiers] = await Promise.all([
    fetchConciergeRequestWithAssignments(id),
    getMarkupTiers(),
  ]);
  if (!request) notFound();
  return <ConciergeJobView job={conciergeJob(request, tiers)} request={request} />;
}
