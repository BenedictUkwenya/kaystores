import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";

type Props = { params: Promise<{ id: string }> };

export default async function VendorOrderDetailRedirect({ params }: Props) {
  const { vendor } = await requireVendor();
  const { id } = await params;
  const items = await fetchVendorOrderItems(vendor.id);
  const mine = items.find((item) => item.orderId === id);
  redirect(mine ? `/vendor/jobs/gift/${mine.id}` : "/vendor");
}
