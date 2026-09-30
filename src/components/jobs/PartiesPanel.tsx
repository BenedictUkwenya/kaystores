import type { ReactNode } from "react";
import { formatJobMoney } from "@/lib/jobs/labels";

type Party = {
  name: string;
  lines?: (string | null | undefined)[];
  extra?: ReactNode;
};

type Props = {
  client: Party;
  vendor: Party;
  clientAmount?: number | null;
  vendorAmount?: number | null;
  paid: boolean;
};

function PartyCard({ role, party, tone }: { role: string; party: Party; tone?: "gold" }) {
  return (
    <div
      className={`min-w-0 flex-1 rounded-2xl border p-4 ${
        tone === "gold" ? "border-kay-gold/40 bg-[#111111] text-white" : "border-kay-border-light bg-kay-surface-elevated"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
          tone === "gold" ? "text-kay-gold" : "text-kay-subtle"
        }`}
      >
        {role}
      </p>
      <p className={`mt-1 truncate text-[14px] font-medium ${tone === "gold" ? "text-white" : "text-kay-fg"}`}>
        {party.name}
      </p>
      {party.lines?.filter(Boolean).map((line) => (
        <p
          key={line}
          className={`truncate text-[12px] ${tone === "gold" ? "text-white/70" : "text-kay-muted"}`}
        >
          {line}
        </p>
      ))}
      {party.extra}
    </div>
  );
}

/**
 * Client ⇄ Kay ⇄ Vendor. Kay sits in the middle: the client never sees the
 * vendor and the vendor never sees the client's contact details or price.
 */
export function PartiesPanel({ client, vendor, clientAmount, vendorAmount, paid }: Props) {
  const margin =
    clientAmount != null && vendorAmount != null ? clientAmount - vendorAmount : null;
  return (
    <section className="space-y-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
        <PartyCard role="Client" party={client} />
        <div className="hidden items-center text-kay-subtle md:flex" aria-hidden>
          ⇄
        </div>
        <PartyCard
          role="Kay (you)"
          tone="gold"
          party={{
            name: paid ? "Paid" : "Not paid yet",
            lines: [
              `Client pays ${formatJobMoney(clientAmount)}`,
              `Vendor gets ${formatJobMoney(vendorAmount)}`,
              margin != null ? `Kay keeps ${formatJobMoney(margin)}` : null,
            ],
          }}
        />
        <div className="hidden items-center text-kay-subtle md:flex" aria-hidden>
          ⇄
        </div>
        <PartyCard role="Vendor" party={vendor} />
      </div>
      <p className="text-[11px] text-kay-subtle">
        Kay is always in the middle. Clients never see the vendor; vendors never see the client&apos;s
        contact details or price.
      </p>
    </section>
  );
}
