import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { getVendorWalletSummary } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatRow } from "@/components/dashboard/DashboardStatRow";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNaira } from "@/lib/data/home";

export default async function VendorWalletPage() {
  const { vendor } = await requireVendor();
  const wallet = await getVendorWalletSummary(vendor.id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Earnings"
      title="Wallet"
      description="Track pending and available balances. Withdraw after admin approval."
    >
      <DashboardStatRow
        stats={[
          { label: "Available", value: formatNaira(wallet.available), accent: true },
          { label: "Pending", value: formatNaira(wallet.pending) },
          { label: "Paid out", value: formatNaira(wallet.paidOut) },
        ]}
      />

      <div className="mt-6 flex justify-stretch sm:justify-end">
        <Link
          href="/vendor/wallet/withdraw"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-kay-accent px-8 text-[13px] font-medium text-kay-accent-fg sm:w-auto"
        >
          Request withdrawal
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)]">
        <div className="border-b border-kay-border-light px-4 py-5 sm:px-6">
          <h2 className="font-serif text-[22px] text-kay-fg">Withdrawal history</h2>
        </div>
        <ul className="divide-y divide-kay-border-light">
          {(wallet.withdrawals as { id: string; amount: number; status: string; created_at: string }[]).map((w) => (
            <li key={w.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="font-medium text-kay-fg">{formatNaira(Number(w.amount))}</p>
                <p className="text-[12px] text-kay-muted">
                  {new Date(w.created_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={w.status} />
            </li>
          ))}
          {wallet.withdrawals.length === 0 && (
            <li className="px-6 py-10 text-center text-[14px] text-kay-muted">
              No withdrawals yet.
            </li>
          )}
        </ul>
      </section>
    </DashboardLayout>
  );
}
