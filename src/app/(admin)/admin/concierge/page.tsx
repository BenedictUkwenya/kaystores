import { requireAdmin } from "@/lib/auth/roles";
import { fetchConciergeRequests } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminConciergeActions } from "@/components/admin/AdminConciergeActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNaira } from "@/lib/data/home";

export default async function AdminConciergePage() {
  await requireAdmin();
  const requests = await fetchConciergeRequests();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Concierge"
      title="Special requests"
      badge="Admin"
    >
      <ul className="space-y-4">
        {requests.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[22px] text-kay-fg">{r.product_name}</p>
                <p className="text-[13px] text-kay-muted">
                  {r.reference_number} · Budget {formatNaira(Number(r.budget))}
                </p>
                <p className="mt-2 text-[13px] text-kay-muted">
                  {r.contact_name} · {r.contact_email} · {r.contact_phone}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-kay-muted whitespace-pre-wrap">
                  {r.description}
                </p>
                <div className="mt-3">
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="w-full sm:max-w-xs">
                <AdminConciergeActions
                id={String(r.id)}
                status={String(r.status)}
                adminNotes={r.admin_notes as string | null}
              />
              </div>
            </div>
          </li>
        ))}
        {requests.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No concierge requests.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
