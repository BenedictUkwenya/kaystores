import Link from "next/link";
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

const TABS = [
  { id: "open", label: "Open", statuses: ["pending", "approved", "processing"] },
  { id: "paid", label: "Paid", statuses: ["paid"] },
  { id: "rejected", label: "Rejected", statuses: ["rejected"] },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting approval",
  approved: "Approved — send transfer",
  processing: "Transfer in progress",
  paid: "Paid",
  rejected: "Rejected",
};

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function AdminPayoutsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t.id === tabParam) ?? TABS[0];
  const withdrawals = await fetchPendingWithdrawals([...tab.statuses]);

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Finance"
      title="Payout queue"
      description="Approve requests, send the bank transfer, then mark them paid. A vendor's balance drops as soon as they request."
      badge="Admin"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/payouts?tab=${t.id}`}
            className={`rounded-full border px-4 py-1.5 text-[12px] font-medium transition ${
              t.id === tab.id
                ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
                : "border-kay-border text-kay-fg hover:border-kay-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <DashboardEmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title={tab.id === "open" ? "No open payouts" : `No ${tab.label.toLowerCase()} payouts`}
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kay-gold">
                    {STATUS_LABEL[String(w.status)] ?? String(w.status)}
                  </p>
                  <p className="mt-1 font-serif text-[28px] text-kay-fg">
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
                  {w.paymentReference && (
                    <p className="mt-2 text-[12px] text-kay-muted">
                      Ref: {w.paymentReference}
                    </p>
                  )}
                </div>
                {tab.id === "open" && (
                  <div className="w-full lg:max-w-xs">
                    <AdminWithdrawalActions withdrawal={w} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
