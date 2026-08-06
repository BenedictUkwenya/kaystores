"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatNaira } from "@/lib/data/home";
import type { ClientConciergeDetail } from "@/types/concierge";

type Props = {
  detail: ClientConciergeDetail;
};

function verifyKey(requestId: string) {
  return `concierge-verify-${requestId}`;
}

export function ConciergeOfferResponse({ detail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRevise, setShowRevise] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [storedEmail, setStoredEmail] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(verifyKey(detail.id));
    if (saved) setStoredEmail(saved);
  }, [detail.id]);

  const offer = detail.recommendedOffer;
  const needsEmail = !storedEmail;

  async function respond(action: "accept" | "revise" | "cancel") {
    const email = storedEmail || verifyEmail.trim();
    if (needsEmail && !email) {
      alert("Enter the email you used on your request.");
      return;
    }

    if (action === "accept") {
      if (
        !confirm(
          "Accept this recommendation? Kay will coordinate payment and fulfilment.",
        )
      ) {
        return;
      }
    }

    if (action === "cancel") {
      if (
        !confirm(
          "Cancel this concierge request entirely? This cannot be undone.",
        )
      ) {
        return;
      }
    }

    if (action === "revise" && !feedback.trim()) {
      alert("Please describe what you are looking for.");
      return;
    }

    setLoading(action);
    try {
      const res = await fetch("/api/concierge/respond-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: detail.id,
          action,
          feedback: action === "revise" ? feedback : undefined,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit response");
      if (email && !storedEmail) {
        sessionStorage.setItem(verifyKey(detail.id), email);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (
    !offer &&
    !detail.selectedAssignmentId &&
    detail.status !== "revision_requested"
  ) {
    return (
      <p className="mt-6 text-[13px] text-kay-muted">
        Kay is reviewing partner offers and will send you a curated recommendation
        to review here.
      </p>
    );
  }

  if (detail.status === "revision_requested") {
    return (
      <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-900">
          Feedback received
        </p>
        <p className="mt-2 text-[13px] text-amber-950">
          Thanks — our concierge team is sourcing another option based on your notes.
        </p>
      </div>
    );
  }

  if (detail.selectedAssignmentId && offer) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-900">
          You accepted Kay&apos;s recommendation
        </p>
        <p className="mt-2 font-serif text-[24px] text-kay-fg">
          {formatNaira(offer.quotedPrice)}
        </p>
        {offer.vendorNotes && (
          <p className="mt-2 text-[13px] text-kay-muted">{offer.vendorNotes}</p>
        )}
        {detail.paymentStatus === "paid" && (
          <p className="mt-3 text-[12px] font-medium text-emerald-800">
            Payment confirmed — sourcing will begin shortly.
          </p>
        )}
        {offer.offerImages.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {offer.offerImages.map((img) => (
              <li key={img.path}>
                <a href={img.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="mt-6 rounded-xl border border-kay-border-light bg-kay-surface-elevated p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-kay-gold">
        Kay&apos;s recommendation
      </p>
      <p className="mt-2 text-[13px] text-kay-muted">
        Our concierge team selected this option for you. Accept to proceed, ask for
        something different, or cancel the request.
      </p>
      <p className="mt-4 font-serif text-[28px] text-kay-fg">
        {formatNaira(offer.quotedPrice)}
      </p>
      {offer.vendorNotes && (
        <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
          {offer.vendorNotes}
        </p>
      )}
      {offer.offerImages.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {offer.offerImages.map((img) => (
            <li key={img.path}>
              <a href={img.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-28 w-full rounded-lg object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      {needsEmail && (detail.canAccept || detail.canRevise || detail.canCancel) && (
        <div className="mt-5 border-t border-kay-border-light pt-5">
          <Input
            label="Confirm your email"
            type="email"
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            placeholder="Email used on your request"
            autoComplete="email"
          />
        </div>
      )}

      {showRevise ? (
        <div className="mt-5 space-y-3 border-t border-kay-border-light pt-5">
          <Textarea
            label="What would you like instead?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Different style, budget, brand, size, colour…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={loading === "revise"}
              onClick={() => respond("revise")}
            >
              {loading === "revise" ? "Sending…" : "Send feedback"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowRevise(false)}
            >
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {detail.canAccept && (
            <Button
              type="button"
              size="sm"
              disabled={Boolean(loading)}
              onClick={() => respond("accept")}
            >
              {loading === "accept" ? "Accepting…" : "Accept recommendation"}
            </Button>
          )}
          {detail.canRevise && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(loading)}
              onClick={() => setShowRevise(true)}
            >
              Not quite — ask for changes
            </Button>
          )}
          {detail.canCancel && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(loading)}
              onClick={() => respond("cancel")}
            >
              {loading === "cancel" ? "Cancelling…" : "Cancel request"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
