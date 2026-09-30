import {
  getTableRequestById,
  updateTableRequest,
} from "@/lib/table/repository";
import { notifyAdminsVendorQuoted } from "@/lib/email/table";
import type { TableRequest } from "@/types/table";

const MAX_VENDOR_QUOTE = 50_000_000;

export class VendorQuoteError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

/** Assigned baker sends their price to Kay (admin adds margin before quoting the client). */
export async function submitVendorKitchenQuote(input: {
  vendorId: string;
  requestId: string;
  amount: unknown;
  note?: unknown;
}): Promise<TableRequest> {
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_VENDOR_QUOTE) {
    throw new VendorQuoteError("Enter a valid price in naira.", 400);
  }
  const note = String(input.note ?? "").trim().slice(0, 1000) || null;

  const existing = await getTableRequestById(input.requestId);
  if (!existing || existing.assignedVendorId !== input.vendorId) {
    throw new VendorQuoteError("Request not found.", 404);
  }
  if (existing.paymentStatus !== "unpaid") {
    throw new VendorQuoteError("The client has already paid — message Kay to change the price.");
  }
  if (existing.status !== "submitted" && existing.status !== "reviewing") {
    throw new VendorQuoteError(
      existing.status === "quoted"
        ? "Kay has already sent the client a quote — message Kay to change your price."
        : "This request is closed.",
    );
  }

  const updated = await updateTableRequest(input.requestId, {
    status: "reviewing",
    vendorQuoteAmount: amount,
    vendorQuoteNote: note,
  });

  await notifyAdminsVendorQuoted(updated).catch((err) =>
    console.error("[vendor quote] admin alert:", err),
  );
  return updated;
}
