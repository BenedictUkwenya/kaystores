import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import { listTableRequests } from "@/lib/table/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminTableRequestCard } from "@/components/admin/AdminTableRequestCard";
import type { TableRequestStatus } from "@/types/table";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: { label: string; status?: TableRequestStatus }[] = [
  { label: "All" },
  { label: "Submitted", status: "submitted" },
  { label: "Reviewing", status: "reviewing" },
  { label: "Quoted", status: "quoted" },
  { label: "Accepted", status: "accepted" },
  { label: "Declined", status: "declined" },
];

export default async function AdminTablePage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status as TableRequestStatus | undefined;

  const [requests, vendors] = await Promise.all([
    listTableRequests({
      status: status || undefined,
      limit: 100,
    }),
    fetchAllVendors("approved"),
  ]);

  const tableVendors = vendors
    .filter((v) => v.canListTable)
    .map((v) => ({ id: v.id, businessName: v.businessName }));

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Kay Kitchen"
      title="Custom requests"
      description="Review cake and edible briefs, assign bakers, quote, and reply in thread."
      badge="Admin"
    >
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href = f.status
            ? `/admin/table?status=${f.status}`
            : "/admin/table";
          const active = (f.status ?? "") === (status ?? "");
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                active
                  ? "bg-kay-accent text-kay-accent-fg"
                  : "border border-kay-border text-kay-muted hover:border-kay-fg"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <ul className="mt-6 space-y-4">
        {requests.map((request) => (
          <AdminTableRequestCard
            key={request.id}
            request={request}
            vendors={tableVendors}
          />
        ))}
      </ul>

      {requests.length === 0 && (
        <p className="mt-8 text-[14px] text-kay-muted">
          No Kay Kitchen requests in this view yet.
        </p>
      )}
    </DashboardLayout>
  );
}
