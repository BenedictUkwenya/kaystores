import { requireVendor } from "@/lib/auth/roles";
import { fetchVendorConciergeItems } from "@/lib/concierge/dispatch";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VendorConciergeFulfilment } from "@/components/vendor/VendorConciergeFulfilment";
import { VendorConciergeResponse } from "@/components/vendor/VendorConciergeResponse";
import { VendorReferenceAttachments } from "@/components/vendor/VendorReferenceAttachments";
import { signConciergeAttachments } from "@/lib/storage/concierge-attachments";
import { formatNaira } from "@/lib/data/home";

export default async function VendorConciergePage() {
  const { vendor } = await requireVendor();
  const items = await fetchVendorConciergeItems(vendor.id);

  const itemsWithFiles = await Promise.all(
    items.map(async (item) => ({
      item,
      signedReferences: await signConciergeAttachments(item.referenceAttachments),
    })),
  );

  const activeJobs = itemsWithFiles.filter(
    ({ item }) => item.outcome === "selected",
  );
  const openRequests = itemsWithFiles.filter(
    ({ item }) => item.outcome !== "selected",
  );

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Concierge"
      title="Sourcing requests"
      description="Kay sends special client requests here. Check your inventory and respond with availability, pricing, and product photos."
    >
      {activeJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Active jobs
          </h2>
          <ul className="mt-4 space-y-4">
            {activeJobs.map(({ item, signedReferences }) => (
              <li
                key={item.assignmentId}
                className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-6 shadow-[var(--kay-card-shadow)]"
              >
                <p className="font-serif text-[22px] text-kay-fg">{item.productName}</p>
                <p className="text-[13px] text-kay-muted">
                  {item.referenceNumber} · {formatNaira(item.quotedPrice ?? item.budget)}
                </p>
                <VendorReferenceAttachments
                  attachments={signedReferences}
                  legacyNames={item.attachmentNames}
                />
                <VendorConciergeFulfilment item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="space-y-4">
        {openRequests.map(({ item, signedReferences }) => (
          <li
            key={item.assignmentId}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[22px] text-kay-fg">{item.productName}</p>
                {item.brand && (
                  <p className="text-[13px] text-kay-muted">{item.brand}</p>
                )}
                <p className="text-[13px] text-kay-muted">
                  {item.referenceNumber} · Client budget {formatNaira(item.budget)}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-kay-muted whitespace-pre-wrap">
                  {item.description}
                </p>
                <VendorReferenceAttachments
                  attachments={signedReferences}
                  legacyNames={item.attachmentNames}
                />
                <div className="mt-3">
                  <StatusBadge
                    status={item.status}
                    label={
                      item.status === "pending"
                        ? "Awaiting your response"
                        : undefined
                    }
                  />
                </div>
              </div>
              <div className="w-full sm:max-w-xs">
                <VendorConciergeResponse item={item} />
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No concierge requests assigned yet. Kay will notify you when a client request matches your catalogue.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
