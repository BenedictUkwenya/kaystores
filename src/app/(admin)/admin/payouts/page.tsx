import { requireAdmin } from "@/lib/auth/roles";
import { fetchPendingWithdrawals } from "@/lib/admin/repository";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminWithdrawalActions } from "@/components/admin/AdminWithdrawalActions";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { formatNaira } from "@/lib/data/home";
import { IconWallet } from "@/components/ui/Icons";
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
      description={`${withdrawals.length} pending withdrawal${
        withdrawals.length === 1 ? "" : "s"
      }. Approve, then mark paid once the transfer is complete.`}
      badge="Admin"
    >
      {withdrawals.length === 0 ? (
        <DashboardEmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title="No pending payouts"
          description="When vendors request withdrawals, they appear here with bank snapshots for review."
        />
      ) : (
        <ul className="space-y-4">
          {withdrawals.map((w: WithdrawalRequest) => (
            <li
              key={w.id}
              className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[28px] text-kay-fg">
                    {formatNaira(w.amount)}
                  </p>
                  <p className="mt-1 text-[13px] text-kay-muted">
                    {w.vendor?.businessName ?? w.vendorId} ·{" "}
                    {w.vendor?.contactEmail}
                  </p>
                  <p className="mt-3 rounded-xl bg-kay-surface px-3 py-2 font-mono text-[11px] text-kay-subtle">
                    {w.bankSnapshot.bank_name} · {w.bankSnapshot.account_number}{" "}
                    · {w.bankSnapshot.account_name}
                  </p>
                </div>
                <div className="w-full lg:max-w-xs">
                  <AdminWithdrawalActions withdrawal={w} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
