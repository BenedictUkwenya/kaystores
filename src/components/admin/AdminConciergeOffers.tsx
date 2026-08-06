"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/data/home";
import type { ConciergeRequestWithAssignments } from "@/types/concierge";

type Props = {
  request: ConciergeRequestWithAssignments;
};

export function AdminConciergeOffers({ request }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const offers = request.assignments.filter((a) => a.status === "has_product");
  const selected = request.assignments.find(
    (a) => a.id === request.selectedAssignmentId,
  );
  const recommended = request.assignments.find(
    (a) => a.id === request.recommendedAssignmentId,
  );

  const canPresent =
    !request.selectedAssignmentId &&
    !request.recommendedAssignmentId &&
    offers.length > 0 &&
    ["with_vendors", "offers_ready", "revision_requested"].includes(
      request.status,
    );

  async function present(assignmentId: string) {
    setLoadingId(assignmentId);
    try {
      const res = await fetch("/api/admin/concierge/present-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, assignmentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not present offer");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Present failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function releaseContact() {
    setLoadingId("contact");
    try {
      const res = await fetch("/api/admin/concierge/release-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });
      if (!res.ok) throw new Error("Release failed");
      router.refresh();
    } catch {
      alert("Could not release contact");
    } finally {
      setLoadingId(null);
    }
  }

  if (request.status === "revision_requested" && request.clientFeedback) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-[12px] text-amber-950">
          <p className="font-semibold uppercase tracking-[0.08em]">
            Client feedback
          </p>
          <p className="mt-2 whitespace-pre-wrap">{request.clientFeedback}</p>
          <p className="mt-2 text-amber-800">
            Present a different partner offer below.
          </p>
        </div>
        {canPresent && offers.length > 0 && (
          <OfferList
            offers={offers}
            loadingId={loadingId}
            onPresent={present}
          />
        )}
      </div>
    );
  }

  if (selected) {
    return (
      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-[12px] text-emerald-900">
        <p className="font-semibold uppercase tracking-[0.08em]">
          Client accepted
        </p>
        <p className="mt-1">
          {selected.vendorBusinessName} ·{" "}
          {selected.quotedPrice != null
            ? formatNaira(selected.quotedPrice)
            : "Price TBD"}
        </p>
        {!request.contactReleasedAt && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loadingId === "contact"}
            onClick={releaseContact}
            className="mt-2 w-full"
          >
            Release client contact to vendor
          </Button>
        )}
        {request.contactReleasedAt && (
          <p className="mt-1 text-emerald-800">Client contact released to vendor</p>
        )}
      </div>
    );
  }

  if (recommended && request.status === "client_reviewing") {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 p-3 text-[12px] text-violet-900">
          <p className="font-semibold uppercase tracking-[0.08em]">
            Awaiting client response
          </p>
          <p className="mt-1">
            Presented: {recommended.vendorBusinessName} ·{" "}
            {recommended.quotedPrice != null
              ? formatNaira(recommended.quotedPrice)
              : "—"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {canPresent && offers.length > 0 ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-kay-muted">
            Present one offer to client
          </p>
          <OfferList offers={offers} loadingId={loadingId} onPresent={present} />
        </>
      ) : offers.length > 0 ? (
        <ul className="space-y-1 text-[12px] text-kay-muted">
          {offers.map((o) => (
            <li key={o.id} className="flex justify-between gap-2">
              <span className="truncate">{o.vendorBusinessName}</span>
              <span className="shrink-0">
                {o.quotedPrice != null ? formatNaira(o.quotedPrice) : "—"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function OfferList({
  offers,
  loadingId,
  onPresent,
}: {
  offers: ConciergeRequestWithAssignments["assignments"];
  loadingId: string | null;
  onPresent: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li
          key={o.id}
          className="flex flex-col gap-2 rounded-lg border border-kay-border-light p-2 text-[12px]"
        >
          <div className="flex justify-between gap-2">
            <span className="truncate font-medium text-kay-fg">
              {o.vendorBusinessName}
            </span>
            <span className="shrink-0 text-kay-muted">
              {o.quotedPrice != null ? formatNaira(o.quotedPrice) : "—"}
            </span>
          </div>
          {o.vendorNotes && (
            <p className="line-clamp-2 text-kay-muted">{o.vendorNotes}</p>
          )}
          <Button
            type="button"
            size="sm"
            disabled={loadingId === o.id}
            onClick={() => onPresent(o.id)}
            className="w-full"
          >
            {loadingId === o.id ? "Sending…" : "Present to client"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
