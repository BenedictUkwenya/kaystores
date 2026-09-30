import { requireAdmin } from "@/lib/auth/roles";
import { AdminBoardPage } from "@/components/jobs/AdminBoardPage";

type Props = { searchParams: Promise<{ view?: string }> };

export default async function AdminConciergePage({ searchParams }: Props) {
  await requireAdmin();
  const { view } = await searchParams;
  return <AdminBoardPage kind="concierge" view={view} />;
}
