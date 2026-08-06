import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { fetchAllVendors } from "@/lib/admin/repository";
import {
  fetchConciergeQueueCounts,
  fetchConciergeRequestsWithAssignments,
} from "@/lib/concierge/dispatch";
import {
  ADMIN_NAV,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { AdminConciergeActions } from "@/components/admin/AdminConciergeActions";
import { AdminConciergeAttachments } from "@/components/admin/AdminConciergeAttachments";
import { AdminConciergeDispatch } from "@/components/admin/AdminConciergeDispatch";
import { AdminConciergeOffers } from "@/components/admin/AdminConciergeOffers";
import { AdminConciergeQueue } from "@/components/admin/AdminConciergeQueue";
import { signConciergeAttachments } from "@/lib/storage/concierge-attachments";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNaira } from "@/lib/data/home";
import { CONCIERGE_STATUS_LABELS } from "@/lib/concierge/status";
import type { ConciergeQueueFilter } from "@/types/concierge";

const PAGE_SIZE = 25;

type PageProps = {
  searchParams: Promise<{ queue?: string; page?: string }>;
};

export default async function AdminConciergePage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const filter = (params.queue as ConciergeQueueFilter) ?? "all";
  const page = Math.max(1, Number(params.page ?? 1));

  const [{ requests, total }, counts, approvedVendors] = await Promise.all([
    fetchConciergeRequestsWithAssignments({
      filter,
      page,
      pageSize: PAGE_SIZE,
    }),
    fetchConciergeQueueCounts(),
    fetchAllVendors("approved"),
  ]);

  const vendorOptions = approvedVendors.map((v) => ({
    id: v.id,
    businessName: v.businessName,
  }));

  const requestsWithFiles = await Promise.all(
    requests.map(async (request) => ({
      request,
      signedAttachments: await signConciergeAttachments(
        request.attachments ?? [],
      ),
    })),
  );

  return (
    <DashboardLayout
      role="admin"
      nav={ADMIN_NAV}
      eyebrow="Concierge"
      title="Special requests"
      description="Review client requests, dispatch to vendors, present curated offers, and monitor fulfilment."
      badge="Admin"
    >
      <Suspense fallback={null}>
        <AdminConciergeQueue
          counts={counts}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </Suspense>

      <ul className="mt-6 space-y-4">
        {requestsWithFiles.map(({ request: r, signedAttachments }) => {
          const legacyNames =
            signedAttachments.length === 0 && r.attachmentNames.length > 0
              ? r.attachmentNames
              : [];
          const stale =
            r.status === "with_vendors" &&
            r.assignments.every((a) => a.status === "pending") &&
            Date.now() - new Date(r.dispatchedAt ?? r.createdAt).getTime() >
              48 * 60 * 60 * 1000;

          return (
            <li
              key={r.id}
              className={`rounded-2xl border bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] ${
                stale
                  ? "border-amber-300/80"
                  : "border-kay-border-light"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-[22px] text-kay-fg">{r.productName}</p>
                    {stale && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                        Stale &gt;48h
                      </span>
                    )}
                  </div>
                  {r.brand && (
                    <p className="text-[13px] text-kay-muted">{r.brand}</p>
                  )}
                  <p className="text-[13px] text-kay-muted">
                    {r.referenceNumber} · Budget {formatNaira(r.budget)}
                  </p>
                  <p className="mt-2 text-[13px] text-kay-muted">
                    {r.contactName} · {r.contactEmail} · {r.contactPhone}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-kay-muted whitespace-pre-wrap">
                    {r.description}
                  </p>
                  <AdminConciergeAttachments
                    attachments={signedAttachments}
                    legacyNames={legacyNames}
                  />
                  <div className="mt-3">
                    <StatusBadge
                      status={r.status}
                      label={CONCIERGE_STATUS_LABELS[r.status]}
                    />
                  </div>
                </div>
                <div className="w-full space-y-4 sm:max-w-sm">
                  <AdminConciergeDispatch
                    requestId={r.id}
                    assignments={r.assignments}
                    approvedVendors={vendorOptions}
                  />
                  <AdminConciergeOffers request={r} />
                  <AdminConciergeActions
                    id={r.id}
                    status={r.status}
                    adminNotes={r.adminNotes}
                  />
                </div>
              </div>
            </li>
          );
        })}
        {requests.length === 0 && (
          <li className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated px-6 py-14 text-center text-[14px] text-kay-muted">
            No requests in this queue.
          </li>
        )}
      </ul>
    </DashboardLayout>
  );
}
