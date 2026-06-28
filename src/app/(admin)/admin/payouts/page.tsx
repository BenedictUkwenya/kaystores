import { requireAdmin } from "@/lib/auth/roles";
import { fetchPendingWithdrawals } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminWithdrawalActions } from "@/components/admin/AdminWithdrawalActions";
import { formatNaira } from "@/lib/data/home";
import type { WithdrawalRequest } from "@/types/dashboard";

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const withdrawals = await fetchPendingWithdrawals();

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Finance"
      title="Payout queue"
      description="Approve and mark vendor withdrawals as paid."
      badge="Admin"
    >
      <ul className="space-y-4">
        {withdrawals.map((w: WithdrawalRequest) => (
          <li
            key={w.id}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[24px] text-kay-fg">
                  {formatNaira(w.amount)}
                </p>
                <p className="mt-1 text-[13px] text-kay-muted">
                  {w.vendor?.businessName ?? w.vendorId} · {w.vendor?.contactEmail}
                </p>
                <p className="mt-2 font-mono text-[11px] text-kay-subtle">
                  {w.bankSnapshot.bank_name} · {w.bankSnapshot.account_number} ·{" "}
                  {w.bankSnapshot.account_name}
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <AdminWithdrawalActions withdrawal={w} />
              </div>
            </div>
          </li>
        ))}
        {withdrawals.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No pending withdrawals.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
