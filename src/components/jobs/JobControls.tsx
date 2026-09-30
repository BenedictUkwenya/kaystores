"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatIntegerInput, parseIntegerInput } from "@/lib/data/home";
import { formatJobMoney } from "@/lib/jobs/labels";
import type { JobKind, JobQuickAction } from "@/lib/jobs/types";
import {
  JobActionButton,
  JobActionError,
  JobActionPrompt,
  useJobAction,
} from "@/components/jobs/JobAction";

type VendorOption = { id: string; businessName: string };

const fieldClass =
  "mt-1 h-10 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 text-[13px] text-kay-fg";

export function AssignVendorForm({
  kind,
  id,
  vendors,
  currentVendorId,
  label = "Choose the baker",
  help,
}: {
  kind: JobKind;
  id: string;
  vendors: VendorOption[];
  currentVendorId?: string | null;
  label?: string;
  help?: string;
}) {
  const { run, loading, error } = useJobAction(kind, id);
  const [vendorId, setVendorId] = useState(currentVendorId ?? "");
  if (vendors.length === 0) {
    return (
      <p className="text-[12px] text-kay-muted">
        No approved vendors can take this yet. Turn on Kay Kitchen for a vendor in Vendors first.
      </p>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run({ action: "assign_vendor", vendorId });
      }}
    >
      <label className="block text-[12px] font-medium text-kay-fg">
        {label}
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={fieldClass}>
          <option value="">Pick one…</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.businessName}
            </option>
          ))}
        </select>
      </label>
      {help && <p className="text-[11px] leading-relaxed text-kay-muted">{help}</p>}
      <Button
        type="submit"
        size="sm"
        disabled={loading || !vendorId || vendorId === currentVendorId}
      >
        {loading ? "Sending…" : currentVendorId ? "Switch baker" : "Send brief to baker"}
      </Button>
      <JobActionError message={error} />
    </form>
  );
}

export function SendQuoteForm({
  id,
  vendorPrice,
  suggestedPrice,
  currentQuote,
  currentNote,
  resend,
}: {
  id: string;
  vendorPrice?: number | null;
  suggestedPrice?: number | null;
  currentQuote?: number | null;
  currentNote?: string | null;
  resend?: boolean;
}) {
  const { run, loading, error } = useJobAction("kitchen", id);
  const [amount, setAmount] = useState(
    formatIntegerInput(String(currentQuote ?? suggestedPrice ?? "")),
  );
  const [note, setNote] = useState(currentNote ?? "");
  const value = amount ? parseIntegerInput(amount) : 0;
  const margin = vendorPrice != null && value ? value - vendorPrice : null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !window.confirm(
            `${resend ? "Update" : "Send"} a quote of ${formatJobMoney(value)} to the client? They'll be emailed to accept & pay or decline.`,
          )
        ) {
          return;
        }
        void run({ action: "send_quote", amount: value, note });
      }}
    >
      {vendorPrice != null && (
        <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
          <div className="rounded-xl bg-kay-surface p-2">
            <p className="text-kay-subtle">Baker&apos;s price</p>
            <p className="font-semibold text-kay-fg">{formatJobMoney(vendorPrice)}</p>
          </div>
          <div className="rounded-xl bg-kay-surface p-2">
            <p className="text-kay-subtle">Suggested</p>
            <p className="font-semibold text-kay-fg">{formatJobMoney(suggestedPrice)}</p>
          </div>
          <div className="rounded-xl bg-kay-surface p-2">
            <p className="text-kay-subtle">Kay keeps</p>
            <p className={`font-semibold ${margin != null && margin < 0 ? "text-red-600" : "text-kay-fg"}`}>
              {formatJobMoney(margin)}
            </p>
          </div>
        </div>
      )}
      <label className="block text-[12px] font-medium text-kay-fg">
        Price the client pays (₦)
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(formatIntegerInput(e.target.value))}
          className={fieldClass}
        />
      </label>
      <label className="block text-[12px] font-medium text-kay-fg">
        Note for the client (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder="Includes delivery, two tiers, gold leaf…"
          className={fieldClass}
        />
      </label>
      <Button type="submit" size="sm" disabled={loading || value < 1}>
        {loading ? "Sending…" : resend ? "Update quote" : "Send quote to client"}
      </Button>
      <JobActionError message={error} />
    </form>
  );
}

/** Hub step button, plus "Failed quality check" when the item is at the hub. */
export function HubStepControls({
  kind,
  id,
  quickAction,
  allowQcFail,
}: {
  kind: JobKind;
  id: string;
  quickAction?: JobQuickAction;
  allowQcFail?: boolean;
}) {
  const [failing, setFailing] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {quickAction && (
          <JobActionButton
            kind={kind}
            id={id}
            body={{ action: quickAction.action, itemId: quickAction.itemId }}
            label={quickAction.label}
            confirm={quickAction.confirm}
          />
        )}
        {allowQcFail && (
          <Button type="button" size="sm" variant="outline" onClick={() => setFailing((v) => !v)}>
            Failed quality check
          </Button>
        )}
      </div>
      {allowQcFail && failing && (
        <JobActionPrompt
          kind={kind}
          id={id}
          action="qc_fail"
          field="note"
          label="What's wrong? The vendor sees this."
          multiline
          submitLabel="Send back to vendor"
          variant="outline"
          extra={quickAction?.itemId ? { itemId: quickAction.itemId } : undefined}
        />
      )}
    </div>
  );
}

export function OfferPicker({
  id,
  offers,
}: {
  id: string;
  offers: {
    assignmentId: string;
    vendorName: string;
    vendorPrice: number | null;
    clientPrice: number | null;
    notes: string;
    photoCount: number;
  }[];
}) {
  const { run, loading, error } = useJobAction("concierge", id);
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {offers.map((offer) => (
          <li
            key={offer.assignmentId}
            className="rounded-xl border border-kay-border-light bg-kay-surface-elevated p-3 text-[12px]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium text-kay-fg">{offer.vendorName}</span>
              <span className="text-kay-muted">
                Vendor {formatJobMoney(offer.vendorPrice)} → client{" "}
                <strong className="text-kay-fg">{formatJobMoney(offer.clientPrice)}</strong>
              </span>
            </div>
            {offer.notes && <p className="mt-1 whitespace-pre-wrap text-kay-muted">{offer.notes}</p>}
            {offer.photoCount > 0 && (
              <p className="mt-1 text-kay-subtle">{offer.photoCount} photo(s) attached</p>
            )}
            <Button
              type="button"
              size="sm"
              className="mt-2"
              disabled={loading}
              onClick={async () => {
                if (
                  !window.confirm(
                    `Show this offer to the client at ${formatJobMoney(offer.clientPrice)}? They'll be emailed to accept or ask for changes.`,
                  )
                ) {
                  return;
                }
                setBusy(offer.assignmentId);
                await run({ action: "present_offer", assignmentId: offer.assignmentId });
                setBusy(null);
              }}
            >
              {busy === offer.assignmentId ? "Sending…" : "Present this to the client"}
            </Button>
          </li>
        ))}
      </ul>
      <JobActionError message={error} />
    </div>
  );
}

/** Last-resort manual status change, hidden under "More" and always confirmed. */
export function StatusOverride({
  kind,
  id,
  current,
  options,
}: {
  kind: JobKind;
  id: string;
  current: string;
  options: { value: string; label: string }[];
}) {
  const { run, loading, error } = useJobAction(kind, id);
  const [status, setStatus] = useState(current);
  return (
    <div className="space-y-2">
      <label className="block text-[12px] font-medium text-kay-fg">
        Force the status (only if something went wrong)
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading || status === current}
        onClick={() => {
          if (
            !window.confirm(
              "Forcing a status skips Kay's normal checks and may email the client. Only do this to fix a mistake. Continue?",
            )
          ) {
            return;
          }
          void run({ action: "set_status", status });
        }}
      >
        {loading ? "Saving…" : "Force status"}
      </Button>
      <JobActionError message={error} />
    </div>
  );
}
