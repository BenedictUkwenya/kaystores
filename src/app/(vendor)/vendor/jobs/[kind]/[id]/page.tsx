import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireVendor } from "@/lib/auth/roles";
import { getVendorJob } from "@/lib/jobs";
import { formatJobMoney, isJobKind, JOB_KIND_LABELS } from "@/lib/jobs/labels";
import type { VendorJob } from "@/lib/jobs/types";
import { fetchVendorOrderItems } from "@/lib/vendors/repository";
import { nearestHubsForVendor, getShippingHubById } from "@/lib/shipping/hubs";
import { getTableRequestById, toVendorSafeRequest } from "@/lib/table/repository";
import { signTableReferenceImages } from "@/lib/table/images";
import { fetchVendorConciergeAssignments } from "@/lib/concierge/dispatch";
import { signConciergeAttachments } from "@/lib/storage/concierge-attachments";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VendorConciergeItem } from "@/types/concierge";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { JobKindBadge, JobStageBadge, JobUrgencyBadge } from "@/components/jobs/JobBadges";
import { JobActionButton } from "@/components/jobs/JobAction";
import { VendorFulfillmentActions } from "@/components/vendor/VendorFulfillmentActions";
import { VendorConciergeResponse } from "@/components/vendor/VendorConciergeResponse";
import { VendorReferenceAttachments } from "@/components/vendor/VendorReferenceAttachments";
import { VendorTableQuoteForm } from "@/components/table/VendorTableQuoteForm";
import { TableReferencePhotos } from "@/components/table/TableReferencePhotos";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import { OrderSupportChat } from "@/components/orders/OrderSupportChat";

type Props = { params: Promise<{ kind: string; id: string }> };

type Hub = { name: string; address?: string | null; phone?: string | null };

function Shell({ job, children }: { job: VendorJob; children: ReactNode }) {
  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow={`${JOB_KIND_LABELS[job.kind]} · ${job.reference}`}
      title={job.title}
      description={job.subtitle}
      actions={
        <Link
          href="/vendor"
          className="inline-flex h-10 items-center rounded-full border border-kay-border px-5 text-[12px] font-medium text-kay-fg hover:border-kay-fg"
        >
          ← Your jobs
        </Link>
      }
    >
      <div className="space-y-6">
        <section
          className={`rounded-2xl border p-5 shadow-[var(--kay-card-shadow)] ${
            job.tab === "todo" ? "border-kay-gold/50 bg-kay-gold-light/25" : "border-kay-border-light bg-kay-surface-elevated"
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <JobKindBadge kind={job.kind} />
            <JobStageBadge stage={job.stage} />
            <JobUrgencyBadge urgency={job.urgency} />
            {job.amount != null && (
              <span className="ml-auto text-[13px] font-medium text-kay-fg">
                You get {formatJobMoney(job.amount)}
              </span>
            )}
          </div>
          <p className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${job.tab === "todo" ? "text-kay-gold" : "text-kay-subtle"}`}>
            {job.tab === "todo" ? "Your turn" : job.tab === "done" ? "Finished" : "Waiting on Kay or the client"}
          </p>
          <p className="mt-1 font-serif text-[20px] leading-snug text-kay-fg">{job.nextStep}</p>
          {job.neededBy && <p className="mt-1 text-[12px] text-kay-muted">Needed by {job.neededBy}</p>}
        </section>
        {children}
      </div>
    </DashboardLayout>
  );
}

function HubDropoff({ hub, reference, children }: { hub: Hub | null; reference: string; children?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-kay-gold/30 bg-kay-gold-light/20 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">Bring it to</p>
      {hub ? (
        <>
          <p className="mt-1 text-[16px] font-medium text-kay-fg">{hub.name}</p>
          {hub.address && <p className="text-[13px] text-kay-muted">{hub.address}</p>}
          {hub.phone && (
            <p className="mt-2 text-[13px] text-kay-fg">
              Put this number on the package: <span className="font-mono font-semibold">{hub.phone}</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-[13px] text-kay-muted">Kay will message you with the hub address.</p>
      )}
      <p className="mt-2 text-[12px] text-kay-muted">
        Label it with {reference}. Never send it straight to the client.
      </p>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function Brief({ title, rows, children }: { title: string; rows: [string, ReactNode][]; children?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">{title}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        {rows
          .filter(([, v]) => v != null && v !== "")
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-kay-subtle">{label}</dt>
              <dd className={label.startsWith("Allergies") ? "text-amber-800" : "text-kay-fg"}>{value}</dd>
            </div>
          ))}
      </dl>
      {children}
    </section>
  );
}

function formatAddress(a?: { line1?: string; city?: string; state?: string } | null) {
  return a ? [a.line1, a.city, a.state].filter(Boolean).join(", ") : null;
}

export default async function VendorJobPage({ params }: Props) {
  const { vendor } = await requireVendor();
  const { kind, id } = await params;
  if (!isJobKind(kind) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const job = await getVendorJob(kind, id, vendor.id);
  if (!job) notFound();

  if (kind === "gift") {
    const [items, hubOptions] = await Promise.all([
      fetchVendorOrderItems(vendor.id),
      nearestHubsForVendor(vendor.pickupAddress?.state, 2),
    ]);
    const item = items.find((i) => i.id === id);
    if (!item) notFound();
    const admin = createAdminClient();
    const { data: qc } = admin
      ? await admin.from("vendor_order_items").select("qc_note").eq("id", id).maybeSingle()
      : { data: null };
    const qcNote = (qc as { qc_note?: string | null } | null)?.qc_note;
    return (
      <Shell job={job}>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-subtle">Send it to Kay</p>
            <p className="text-[13px] text-kay-fg">
              {item.productName} × {item.quantity}
            </p>
            {qcNote && item.fulfillmentStatus === "awaiting_hub_delivery" && !item.vendorDispatchedAt && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
                Kay&apos;s quality check failed: {qcNote}
              </p>
            )}
            <VendorFulfillmentActions item={item} hubOptions={hubOptions} />
          </section>
          <OrderSupportChat orderId={item.orderId} viewerRole="vendor" />
        </div>
      </Shell>
    );
  }

  if (kind === "kitchen") {
    const raw = await getTableRequestById(id);
    if (!raw || raw.assignedVendorId !== vendor.id) notFound();
    const r = toVendorSafeRequest(raw);
    const [photos, fallbackHub, pickupHub] = await Promise.all([
      signTableReferenceImages(r.referenceImages),
      nearestHubsForVendor(vendor.pickupAddress?.state, 1).then((h) => h[0] ?? null),
      r.pickupHubId ? getShippingHubById(r.pickupHubId) : Promise.resolve(null),
    ]);
    const hubSource = pickupHub ?? fallbackHub;
    const hub: Hub | null = r.dropoffHubName
      ? { name: r.dropoffHubName, address: r.dropoffHubAddress, phone: r.dropoffHubPhone }
      : hubSource
        ? { name: hubSource.name, address: formatAddress(hubSource.address), phone: hubSource.contactPhone }
        : null;
    const paid = r.paymentStatus === "paid";
    return (
      <Shell job={job}>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {paid ? (
              <HubDropoff hub={hub} reference={r.reference}>
                {r.fulfilmentStage === "awaiting_vendor" && (
                  <JobActionButton
                    kind="kitchen"
                    id={r.id}
                    scope="vendor"
                    body={{ action: "vendor_sent" }}
                    label="I've sent it to the hub"
                    confirm="Confirm it's on its way to the Kay hub?"
                  />
                )}
              </HubDropoff>
            ) : (
              <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
                <VendorTableQuoteForm
                  requestId={r.id}
                  currentAmount={r.vendorQuoteAmount}
                  currentNote={r.vendorQuoteNote}
                  quotedAt={r.vendorQuotedAt}
                  editable={r.paymentStatus === "unpaid" && (r.status === "submitted" || r.status === "reviewing")}
                />
              </section>
            )}
            <Brief
              title="The brief"
              rows={[
                ["What", r.category],
                ["Occasion", r.occasion],
                ["Servings / size", r.servings],
                ["Needed by", r.neededBy],
                ["Flavours", r.flavourNotes],
                ["Style", r.styleNotes],
                ["Message on it", r.messageOnItem],
                ["Allergies / dietary", r.allergies],
                ["Client budget", r.budget != null ? formatJobMoney(r.budget) : null],
                ["Where", r.fulfillmentMethod === "pickup" ? "Client collects from the hub" : [r.city, r.state].filter(Boolean).join(", ") || null],
              ]}
            >
              <TableReferencePhotos urls={photos} className="mt-4" />
            </Brief>
          </div>
          <TableRequestChat requestId={r.id} viewerRole="vendor" />
        </div>
      </Shell>
    );
  }

  const [row] = await fetchVendorConciergeAssignments(vendor.id, id);
  if (!row) notFound();
  const { assignment: a, request: r } = row;
  const references = await signConciergeAttachments(r.attachments ?? []);
  const item: VendorConciergeItem = {
    assignmentId: a.id,
    requestId: r.id,
    referenceNumber: r.referenceNumber,
    productName: r.productName,
    brand: r.brand,
    budget: r.budget,
    description: r.description,
    attachmentNames: r.attachmentNames,
    referenceAttachments: r.attachments,
    status: a.status,
    vendorNotes: a.vendorNotes,
    quotedPrice: a.quotedPrice,
    offerImages: a.offerImages,
    outcome: a.outcome,
    fulfilmentStatus: a.fulfilmentStatus,
    requestPaymentStatus: r.paymentStatus ?? "unpaid",
    sentAt: a.sentAt,
    respondedAt: a.respondedAt,
  };
  const fallbackHub = r.dropoffHubName
    ? null
    : (await nearestHubsForVendor(vendor.pickupAddress?.state, 1))[0] ?? null;
  const hub: Hub | null = r.dropoffHubName
    ? { name: r.dropoffHubName, address: r.dropoffHubAddress, phone: r.dropoffHubPhone }
    : fallbackHub
      ? { name: fallbackHub.name, address: formatAddress(fallbackHub.address), phone: fallbackHub.contactPhone }
      : null;
  const selectedAndPaid = a.outcome === "selected" && r.paymentStatus === "paid";

  return (
    <Shell job={job}>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Brief
          title="What the client is looking for"
          rows={[
            ["Item", r.productName],
            ["Brand", r.brand],
            ["Client budget", formatJobMoney(r.budget)],
          ]}
        >
          {r.description && (
            <p className="mt-3 whitespace-pre-wrap text-[13px] text-kay-muted">{r.description}</p>
          )}
          <VendorReferenceAttachments attachments={references} legacyNames={r.attachmentNames} />
        </Brief>
        {selectedAndPaid ? (
          <HubDropoff hub={hub} reference={r.referenceNumber}>
            {job.tab === "todo" && (
              <JobActionButton
                kind="concierge"
                id={a.id}
                scope="vendor"
                body={{ action: "vendor_sent" }}
                label="I've sent it to the hub"
                confirm="Confirm it's on its way to the Kay hub?"
              />
            )}
          </HubDropoff>
        ) : (
          <section className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5">
            <VendorConciergeResponse item={item} />
          </section>
        )}
      </div>
    </Shell>
  );
}
