import { fetchAllVendors } from "@/lib/admin/repository";
import { applyClientMarkup, getMarkupTiers } from "@/lib/pricing/markup";
import { signConciergeAttachments } from "@/lib/storage/concierge-attachments";
import { CONCIERGE_STATUS_LABELS } from "@/lib/concierge/status";
import { selectedAssignment } from "@/lib/jobs/concierge";
import type { Job } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import type { ConciergeRequestWithAssignments } from "@/types/concierge";
import { AdminConciergeDispatch } from "@/components/admin/AdminConciergeDispatch";
import { AdminConciergeAttachments } from "@/components/admin/AdminConciergeAttachments";
import { PartiesPanel } from "@/components/jobs/PartiesPanel";
import { JobActionPrompt } from "@/components/jobs/JobAction";
import { HubStepControls, OfferPicker, StatusOverride } from "@/components/jobs/JobControls";
import { DetailRow, DetailSection, JobPageShell } from "@/components/jobs/JobPageShell";

const RESPONSE_LABELS: Record<string, string> = {
  pending: "Hasn't replied",
  has_product: "Has it",
  no_product: "Doesn't have it",
  need_more_info: "Needs more info",
};

export async function ConciergeJobView({
  job,
  request: r,
}: {
  job: Job;
  request: ConciergeRequestWithAssignments;
}) {
  const [vendors, tiers, attachments] = await Promise.all([
    fetchAllVendors("approved"),
    getMarkupTiers(),
    signConciergeAttachments(r.attachments ?? []),
  ]);
  const vendorOptions = vendors.map((v) => ({ id: v.id, businessName: v.businessName }));
  const selected = selectedAssignment(r);
  const paid = r.paymentStatus === "paid";
  const closed = r.status === "closed" || r.status === "completed";
  const canPresent =
    !r.selectedAssignmentId &&
    r.paymentStatus !== "paid" &&
    r.paymentStatus !== "pending" &&
    ["with_vendors", "offers_ready", "revision_requested", "client_reviewing"].includes(r.status);
  const offers = r.assignments
    .filter((a) => a.status === "has_product")
    .map((a) => ({
      assignmentId: a.id,
      vendorName: a.vendorBusinessName ?? "Vendor",
      vendorPrice: a.quotedPrice,
      clientPrice: a.quotedPrice != null ? applyClientMarkup(a.quotedPrice, tiers) : null,
      notes: a.vendorNotes,
      photoCount: a.offerImages.length,
    }));
  const atHub = paid && ["at_hub", "qc_passed"].includes(r.fulfilmentStage);
  const refundOwed = job.stage === "cancelled" && job.actor === "admin";

  const dispatch = (
    <AdminConciergeDispatch requestId={r.id} assignments={r.assignments} approvedVendors={vendorOptions} />
  );

  let controls = null;
  if (refundOwed) {
    controls = (
      <JobActionPrompt
        kind="concierge"
        id={r.id}
        action="mark_refunded"
        field="reference"
        label="Refund reference"
        help="Send the refund first, then record it here."
        submitLabel="Mark refunded"
      />
    );
  } else if (paid) {
    controls = <HubStepControls kind="concierge" id={r.id} quickAction={job.quickAction} allowQcFail={atHub} />;
  } else if (job.stage === "new") {
    controls = dispatch;
  } else if (canPresent && offers.length > 0) {
    controls = <OfferPicker id={r.id} offers={offers} />;
  } else if (job.actor === "admin") {
    controls = dispatch;
  }

  const waitingHint =
    job.actor === "vendor" ? (
      <>Vendors are emailed automatically. If it&apos;s overdue, send it to more vendors under More actions.</>
    ) : job.actor === "client" ? (
      <>
        Reach the client on {r.contactPhone || r.contactEmail}. If they paid by bank transfer, record
        it under More actions.
      </>
    ) : null;

  const more = (
    <>
      {!r.selectedAssignmentId && !closed && controls !== dispatch && dispatch}
      {selected && !paid && !closed && (
        <JobActionPrompt
          kind="concierge"
          id={r.id}
          action="mark_paid"
          field="reference"
          label="Client paid by bank transfer? Reference"
          help={`Only after you see ${formatJobMoney(job.clientAmount)} in Kay's account.`}
          submitLabel="Mark paid"
        />
      )}
      {!paid && !closed && (
        <JobActionPrompt
          kind="concierge"
          id={r.id}
          action="close"
          field="reason"
          label="Close this request (internal note)"
          placeholder="No vendor has it / client went quiet…"
          submitLabel="Close request"
          variant="outline"
          required={false}
        />
      )}
      <StatusOverride
        kind="concierge"
        id={r.id}
        current={r.status}
        options={Object.entries(CONCIERGE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />
    </>
  );

  return (
    <JobPageShell
      job={job}
      controls={controls}
      waitingHint={waitingHint}
      more={more}
      parties={
        <PartiesPanel
          paid={paid}
          clientAmount={job.clientAmount}
          vendorAmount={job.vendorAmount}
          client={{ name: r.contactName, lines: [r.contactEmail, r.contactPhone] }}
          vendor={{
            name: selected?.vendorBusinessName ?? (r.assignments.length ? `${r.assignments.length} vendors asked` : "Not sent yet"),
            lines: selected
              ? [r.dropoffHubName ? `Drops at ${r.dropoffHubName}` : null]
              : r.assignments.map((a) => `${a.vendorBusinessName ?? "Vendor"}: ${RESPONSE_LABELS[a.status] ?? a.status}`),
          }}
        />
      }
      details={
        <DetailSection title="What the client wants">
          <DetailRow label="Item" value={r.productName} />
          <DetailRow label="Brand" value={r.brand} />
          <DetailRow label="Budget" value={formatJobMoney(r.budget)} />
          {r.description && <p className="whitespace-pre-wrap text-kay-fg">{r.description}</p>}
          <DetailRow label="Deliver to" value={r.deliverySummary} />
          {r.clientFeedback && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
              Client asked for changes: {r.clientFeedback}
            </p>
          )}
          {r.qcNote && <p className="text-red-700">Last QC fail: {r.qcNote}</p>}
          <AdminConciergeAttachments
            attachments={attachments}
            legacyNames={attachments.length === 0 ? r.attachmentNames : []}
          />
        </DetailSection>
      }
      timeline={[
        { at: r.createdAt, label: "Request came in", detail: r.contactName },
        { at: r.dispatchedAt, label: `Sent to ${r.assignments.length} vendor(s)` },
        ...r.assignments
          .filter((a) => a.respondedAt)
          .map((a) => ({
            at: a.respondedAt,
            label: `${a.vendorBusinessName ?? "Vendor"}: ${RESPONSE_LABELS[a.status] ?? a.status}`,
            detail: a.quotedPrice != null ? formatJobMoney(a.quotedPrice) : null,
          })),
        { at: r.recommendedAt, label: "Offer presented to the client" },
        { at: r.clientSelectedAt, label: "Client accepted" },
        { at: r.paidAt, label: "Client paid", detail: formatJobMoney(r.paymentAmount) },
        { at: r.vendorSentAt, label: "Vendor sent it to the hub", detail: r.dropoffHubName },
        { at: r.hubReceivedAt, label: "Received at the hub" },
        { at: r.qcPassedAt, label: "Passed quality check" },
        { at: r.outForDeliveryAt, label: "Out for delivery" },
        { at: r.deliveredAt, label: "Delivered" },
      ]}
    />
  );
}
