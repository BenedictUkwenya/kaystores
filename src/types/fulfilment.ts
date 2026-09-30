/** After-payment steps for kitchen and concierge jobs (gift orders track this per item). */
export type FulfilmentStage =
  | "awaiting_vendor"
  | "vendor_sent"
  | "at_hub"
  | "qc_passed"
  | "out_for_delivery"
  | "delivered";

export type HubStepFields = {
  fulfilmentStage: FulfilmentStage;
  dropoffHubId?: string | null;
  dropoffHubName?: string | null;
  dropoffHubPhone?: string | null;
  dropoffHubAddress?: string | null;
  vendorSentAt?: string | null;
  hubReceivedAt?: string | null;
  qcPassedAt?: string | null;
  qcNote?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
};

const STAGES: FulfilmentStage[] = [
  "awaiting_vendor",
  "vendor_sent",
  "at_hub",
  "qc_passed",
  "out_for_delivery",
  "delivered",
];

export function parseFulfilmentStage(value: unknown): FulfilmentStage {
  return STAGES.includes(value as FulfilmentStage)
    ? (value as FulfilmentStage)
    : "awaiting_vendor";
}

function str(value: unknown): string | null {
  return value != null ? String(value) : null;
}

export function mapHubStepFields(row: Record<string, unknown>): HubStepFields {
  return {
    fulfilmentStage: parseFulfilmentStage(row.fulfilment_stage),
    dropoffHubId: str(row.dropoff_hub_id),
    dropoffHubName: str(row.dropoff_hub_name),
    dropoffHubPhone: str(row.dropoff_hub_phone),
    dropoffHubAddress: str(row.dropoff_hub_address),
    vendorSentAt: str(row.vendor_sent_at),
    hubReceivedAt: str(row.hub_received_at),
    qcPassedAt: str(row.qc_passed_at),
    qcNote: str(row.qc_note),
    outForDeliveryAt: str(row.out_for_delivery_at),
    deliveredAt: str(row.delivered_at),
  };
}
