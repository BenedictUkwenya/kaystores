import { fetchAllVendors } from "@/lib/admin/repository";
import { applyClientMarkup, getMarkupTiers } from "@/lib/pricing/markup";
import { signTableReferenceImages } from "@/lib/table/images";
import type { Job } from "@/lib/jobs/types";
import { formatJobMoney } from "@/lib/jobs/labels";
import type { TableRequest } from "@/types/table";
import { TABLE_STATUS_LABELS } from "@/components/table/TableRequestStatusTimeline";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import { TableReferencePhotos } from "@/components/table/TableReferencePhotos";
import { PartiesPanel } from "@/components/jobs/PartiesPanel";
import { JobActionPrompt, JobActionButton } from "@/components/jobs/JobAction";
import {
  AssignVendorForm,
  HubStepControls,
  SendQuoteForm,
  StatusOverride,
} from "@/components/jobs/JobControls";
import { DetailRow, DetailSection, JobPageShell } from "@/components/jobs/JobPageShell";

export async function KitchenJobView({ job, request: r }: { job: Job; request: TableRequest }) {
  const [vendors, tiers, photoUrls] = await Promise.all([
    fetchAllVendors("approved"),
    getMarkupTiers(),
    signTableReferenceImages(r.referenceImages),
  ]);
  const bakers = vendors
    .filter((v) => v.canListTable)
    .map((v) => ({ id: v.id, businessName: v.businessName }));
  const suggested = r.vendorQuoteAmount != null ? applyClientMarkup(r.vendorQuoteAmount, tiers) : null;
  const paid = r.paymentStatus === "paid";
  const open = r.paymentStatus === "unpaid" && ["submitted", "reviewing", "quoted"].includes(r.status);
  const atHub = paid && (r.fulfilmentStage === "at_hub" || r.fulfilmentStage === "qc_passed");
  const refundOwed = job.stage === "cancelled" && job.actor === "admin";

  let controls = null;
  if (refundOwed) {
    controls = (
      <JobActionPrompt
        kind="kitchen"
        id={r.id}
        action="mark_refunded"
        field="reference"
        label="Refund reference"
        help="Send the refund from the bank or Paystack first, then record it here."
        submitLabel="Mark refunded"
      />
    );
  } else if (paid) {
    controls = <HubStepControls kind="kitchen" id={r.id} quickAction={job.quickAction} allowQcFail={atHub} />;
  } else if (!r.assignedVendorId) {
    controls = (
      <AssignVendorForm
        kind="kitchen"
        id={r.id}
        vendors={bakers}
        help="They get the brief (no client contact details) and send Kay their price."
      />
    );
  } else if (r.vendorQuoteAmount != null && r.status !== "quoted") {
    controls = (
      <SendQuoteForm
        id={r.id}
        vendorPrice={r.vendorQuoteAmount}
        suggestedPrice={suggested}
        currentQuote={r.quoteAmount}
        currentNote={r.quoteNote}
      />
    );
  }

  const waitingHint =
    job.actor === "vendor" ? (
      <>Chase {r.assignedVendorName ?? "the baker"} on the Baker line in Messages below. Or switch baker under More actions.</>
    ) : job.actor === "client" ? (
      <>
        Nudge the client on the Customer line below. If they paid by bank transfer, record it under
        More actions.
      </>
    ) : null;

  const more = (
    <>
      {open && r.assignedVendorId && (
        <AssignVendorForm
          kind="kitchen"
          id={r.id}
          vendors={bakers}
          currentVendorId={r.assignedVendorId}
          label="Switch baker"
          help="The new baker gets the brief and must send a fresh price."
        />
      )}
      {r.status === "quoted" && !paid && (
        <>
          <JobActionPrompt
            kind="kitchen"
            id={r.id}
            action="mark_paid"
            field="reference"
            label="Client paid by bank transfer? Reference"
            help={`Only after you see ${formatJobMoney(r.quoteAmount)} in Kay's account.`}
            submitLabel="Mark paid"
          />
          <SendQuoteForm
            id={r.id}
            vendorPrice={r.vendorQuoteAmount}
            suggestedPrice={suggested}
            currentQuote={r.quoteAmount}
            currentNote={r.quoteNote}
            resend
          />
        </>
      )}
      {open && r.assignedVendorId && r.vendorQuoteAmount == null && (
        <SendQuoteForm id={r.id} currentQuote={r.quoteAmount} currentNote={r.quoteNote} />
      )}
      {!paid && r.status !== "declined" && r.status !== "fulfilled" && (
        <JobActionButton
          kind="kitchen"
          id={r.id}
          body={{ action: "decline" }}
          label="Decline this request"
          variant="outline"
          confirm="Decline this request? The client is emailed that Kay can't take it."
        />
      )}
      <StatusOverride
        kind="kitchen"
        id={r.id}
        current={r.status}
        options={Object.entries(TABLE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
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
          clientAmount={r.quoteAmount}
          vendorAmount={r.vendorQuoteAmount}
          client={{
            name: r.contactName,
            lines: [r.contactEmail, r.contactPhone],
          }}
          vendor={{
            name: r.assignedVendorName ?? "No baker yet",
            lines: [
              r.vendorQuoteNote ? `“${r.vendorQuoteNote}”` : null,
              r.dropoffHubName ? `Drops at ${r.dropoffHubName}` : null,
            ],
          }}
        />
      }
      details={
        <DetailSection title="The brief">
          <DetailRow label="What" value={r.category} />
          <DetailRow label="Occasion" value={r.occasion} />
          <DetailRow label="Servings" value={r.servings} />
          <DetailRow label="Flavours" value={r.flavourNotes} />
          <DetailRow label="Style" value={r.styleNotes} />
          <DetailRow label="Message on it" value={r.messageOnItem ? `“${r.messageOnItem}”` : null} />
          {r.allergies && <p className="text-amber-800">Allergies / dietary: {r.allergies}</p>}
          <DetailRow label="Needed by" value={r.neededBy} />
          <DetailRow label="Client budget" value={r.budget != null ? formatJobMoney(r.budget) : null} />
          <DetailRow
            label={r.fulfillmentMethod === "pickup" ? "Pickup at" : "Deliver to"}
            value={
              r.fulfillmentMethod === "pickup"
                ? r.pickupHubName ?? "Kay hub"
                : [r.recipientName, r.deliveryAddress ?? [r.city, r.state].filter(Boolean).join(", "), r.recipientPhone]
                    .filter(Boolean)
                    .join(" · ")
            }
          />
          <DetailRow label="Payment ref" value={r.paymentReference} />
          {r.qcNote && <p className="text-red-700">Last QC fail: {r.qcNote}</p>}
          <TableReferencePhotos urls={photoUrls} className="mt-3" />
        </DetailSection>
      }
      chat={
        <TableRequestChat
          requestId={r.id}
          viewerRole="admin"
          hasAssignedVendor={Boolean(r.assignedVendorId)}
        />
      }
      timeline={[
        { at: r.createdAt, label: "Request came in", detail: r.contactName },
        { at: r.vendorQuotedAt, label: `${r.assignedVendorName ?? "Baker"} sent their price`, detail: formatJobMoney(r.vendorQuoteAmount) },
        { at: r.paidAt, label: "Client paid", detail: formatJobMoney(r.quoteAmount) },
        { at: r.vendorSentAt, label: "Baker sent it to the hub", detail: r.dropoffHubName },
        { at: r.hubReceivedAt, label: "Received at the hub" },
        { at: r.qcPassedAt, label: "Passed quality check" },
        { at: r.outForDeliveryAt, label: "Out for delivery" },
        { at: r.deliveredAt, label: r.fulfillmentMethod === "pickup" ? "Collected" : "Delivered" },
      ]}
    />
  );
}
