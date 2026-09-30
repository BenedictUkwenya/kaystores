import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/jobs/gift/${id}`);
}
