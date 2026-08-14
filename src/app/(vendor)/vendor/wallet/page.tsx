import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { getVendorWalletSummary } from "@/lib/vendors/repository";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatRow } from "@/components/dashboard/DashboardStatRow";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { PortalSection } from "@/components/dashboard/PortalPrimitives";
import { formatNaira } from "@/lib/data/home";
import { IconWallet } from "@/components/ui/Icons";

export default async function VendorWalletPage() {
  const { vendor } = await requireVendor();
  const wallet = await getVendorWalletSummary(vendor.id);

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Earnings"
      title="Wallet"
      description="Pending clears after hub QC. Available balances can be withdrawn once bank details are set."
      actions={
        <Link
          href="/vendor/wallet/withdraw"
          className="inline-flex h-10 items-center rounded-full bg-kay-accent px-5 text-[12px] font-medium text-kay-accent-fg"
        >
          Request withdrawal
        </Link>
      }
    >
      <DashboardStatRow
        stats={[
          {
            label: "Available",
            value: formatNaira(wallet.available),
            hint: "Ready to withdraw",
            accent: true,
            icon: <IconWallet className="h-[18px] w-[18px]" />,
          },
          {
            label: "Pending",
            value: formatNaira(wallet.pending),
            hint: "Awaiting QC / release",
          },
          {
            label: "Paid out",
            value: formatNaira(wallet.paidOut),
            hint: "Lifetime completed",
          },
        ]}
      />

      <div className="mt-8">
        <PortalSection
          title="Withdrawal history"
          description="Track requests from pending approval through paid."
          actionHref="/vendor/settings"
          actionLabel="Bank details"
        >
          {wallet.withdrawals.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={<IconWallet className="h-6 w-6" />}
                title="No withdrawals yet"
                description="Once you have an available balance and bank details on file, request a payout."
                actionHref="/vendor/wallet/withdraw"
                actionLabel="Request withdrawal"
              />
            </div>
          ) : (
            <ul className="divide-y divide-kay-border-light">
              {(
                wallet.withdrawals as {
                  id: string;
                  amount: number;
                  status: string;
                  created_at: string;
                }[]
              ).map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div>
                    <p className="font-serif text-[20px] text-kay-fg">
                      {formatNaira(Number(w.amount))}
                    </p>
                    <p className="text-[12px] text-kay-muted">
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={w.status} />
                </li>
              ))}
            </ul>
          )}
        </PortalSection>
      </div>
    </DashboardLayout>
  );
}
