"use client";

import { RelayChat } from "@/components/chat/RelayChat";
import type { TableSenderRole } from "@/types/table";

type Props = {
  requestId: string;
  viewerRole: TableSenderRole;
  apiBase?: string;
  /** Admin only: disable the baker line when nobody is assigned. */
  hasAssignedVendor?: boolean;
};

const DESCRIPTIONS: Record<TableSenderRole, string> = {
  customer: "Message the Kay team about this request. Kay coordinates with your baker for you.",
  vendor: "Message the Kay team about this brief. Kay relays anything to and from the client.",
  admin: "Two private lines — the customer and the baker never see each other's messages. Relay what's needed.",
};

export function TableRequestChat({
  requestId,
  viewerRole,
  apiBase = `/api/table/requests/${requestId}/messages`,
  hasAssignedVendor = true,
}: Props) {
  return (
    <RelayChat
      apiBase={apiBase}
      viewerRole={viewerRole}
      title="Request chat"
      description={DESCRIPTIONS[viewerRole]}
      emptyText="No messages yet. Ask about flavours, timing, or delivery here."
      customerLabel="Customer"
      vendorLabel="Baker"
      vendorUnavailable={
        hasAssignedVendor ? undefined : "Assign a baker to open this line."
      }
      minHeight="min-h-[380px]"
    />
  );
}
