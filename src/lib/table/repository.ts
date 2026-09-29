import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ChatChannel,
  CreateTableRequestInput,
  TableFulfillmentMethod,
  TableRequest,
  TableRequestMessage,
  TableRequestStatus,
  TableSenderRole,
} from "@/types/table";

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

function generateReference() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TBL-${n.slice(-5)}${r}`;
}

function mapRequest(
  row: Record<string, unknown>,
  vendorName?: string | null,
): TableRequest {
  const method = row.fulfillment_method;
  return {
    id: String(row.id),
    reference: String(row.reference),
    status: row.status as TableRequestStatus,
    userId: row.user_id != null ? String(row.user_id) : null,
    contactName: String(row.contact_name),
    contactEmail: String(row.contact_email),
    contactPhone: row.contact_phone != null ? String(row.contact_phone) : null,
    occasion: row.occasion != null ? String(row.occasion) : null,
    servings: row.servings != null ? String(row.servings) : null,
    flavourNotes: row.flavour_notes != null ? String(row.flavour_notes) : null,
    styleNotes: row.style_notes != null ? String(row.style_notes) : null,
    neededBy: row.needed_by != null ? String(row.needed_by) : null,
    city: row.city != null ? String(row.city) : null,
    state: row.state != null ? String(row.state) : null,
    fulfillmentMethod:
      method === "pickup" ? "pickup" : ("delivery" as TableFulfillmentMethod),
    pickupHubId:
      row.pickup_hub_id != null ? String(row.pickup_hub_id) : null,
    pickupHubName:
      row.pickup_hub_name != null ? String(row.pickup_hub_name) : null,
    budget: row.budget != null ? Number(row.budget) : null,
    category: (row.category as TableRequest["category"]) ?? "cake",
    assignedVendorId:
      row.assigned_vendor_id != null ? String(row.assigned_vendor_id) : null,
    assignedVendorName: vendorName ?? null,
    quoteAmount: row.quote_amount != null ? Number(row.quote_amount) : null,
    quoteNote: row.quote_note != null ? String(row.quote_note) : null,
    vendorQuoteAmount:
      row.vendor_quote_amount != null ? Number(row.vendor_quote_amount) : null,
    vendorQuoteNote:
      row.vendor_quote_note != null ? String(row.vendor_quote_note) : null,
    vendorQuotedAt:
      row.vendor_quoted_at != null ? String(row.vendor_quoted_at) : null,
    paymentStatus: (["pending", "paid", "refunded"].includes(String(row.payment_status))
      ? row.payment_status
      : "unpaid") as TableRequest["paymentStatus"],
    paymentReference: row.payment_reference != null ? String(row.payment_reference) : null,
    paidAt: row.paid_at != null ? String(row.paid_at) : null,
    deliveryAddress: row.delivery_address != null ? String(row.delivery_address) : null,
    recipientName: row.recipient_name != null ? String(row.recipient_name) : null,
    recipientPhone: row.recipient_phone != null ? String(row.recipient_phone) : null,
    allergies: row.allergies != null ? String(row.allergies) : null,
    messageOnItem: row.message_on_item != null ? String(row.message_on_item) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): TableRequestMessage {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    senderId: row.sender_id != null ? String(row.sender_id) : null,
    senderRole: row.sender_role as TableSenderRole,
    senderName: String(row.sender_name ?? "Kay"),
    body: String(row.body ?? ""),
    channel: row.channel === "vendor" ? "vendor" : "customer",
    createdAt: String(row.created_at),
  };
}

/** Vendors never get customer contact details — Kay relays everything. */
export function toVendorSafeRequest(request: TableRequest): TableRequest {
  return {
    ...request,
    userId: null,
    contactName: request.contactName.trim().split(/\s+/)[0] || "Client",
    contactEmail: "",
    contactPhone: null,
    // Kay delivers from the hub; the baker only needs the city.
    deliveryAddress: null,
    recipientName: null,
    recipientPhone: null,
    paymentReference: null,
    // The client price includes Kay's margin.
    quoteAmount: null,
    quoteNote: null,
  };
}

export async function createTableRequest(
  input: CreateTableRequestInput,
): Promise<TableRequest> {
  const method: TableFulfillmentMethod =
    input.fulfillmentMethod === "pickup" ? "pickup" : "delivery";

  const { data, error } = await db()
    .from("table_requests")
    .insert({
      reference: generateReference(),
      status: "submitted",
      user_id: input.userId ?? null,
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      contact_phone: input.contactPhone?.trim() || null,
      occasion: input.occasion?.trim() || null,
      servings: input.servings?.trim() || null,
      flavour_notes: input.flavourNotes?.trim() || null,
      style_notes: input.styleNotes?.trim() || null,
      needed_by: input.neededBy || null,
      fulfillment_method: method,
      city: method === "delivery" ? input.city?.trim() || null : null,
      state: method === "delivery" ? input.state?.trim() || null : null,
      pickup_hub_id:
        method === "pickup" &&
        input.pickupHubId &&
        /^[0-9a-f-]{36}$/i.test(input.pickupHubId)
          ? input.pickupHubId
          : null,
      pickup_hub_name:
        method === "pickup" ? input.pickupHubName?.trim() || null : null,
      budget:
        input.budget != null && Number.isFinite(input.budget)
          ? Math.max(0, Math.floor(input.budget))
          : null,
      category: input.category ?? "cake",
      delivery_address:
        method === "delivery" ? input.deliveryAddress?.trim().slice(0, 300) || null : null,
      recipient_name: input.recipientName?.trim().slice(0, 120) || null,
      recipient_phone: input.recipientPhone?.trim().slice(0, 30) || null,
      allergies: input.allergies?.trim().slice(0, 500) || null,
      message_on_item: input.messageOnItem?.trim().slice(0, 120) || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save your request.");
  }
  return mapRequest(data as Record<string, unknown>);
}

export async function getTableRequestById(
  id: string,
): Promise<TableRequest | null> {
  const { data, error } = await db()
    .from("table_requests")
    .select("*, vendors(business_name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const vendors = data.vendors as { business_name?: string } | null;
  return mapRequest(
    data as Record<string, unknown>,
    vendors?.business_name ?? null,
  );
}

export async function listTableRequests(opts?: {
  status?: TableRequestStatus;
  vendorId?: string;
  limit?: number;
}): Promise<TableRequest[]> {
  let query = db()
    .from("table_requests")
    .select("*, vendors(business_name)")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.vendorId) query = query.eq("assigned_vendor_id", opts.vendorId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const vendors = row.vendors as { business_name?: string } | null;
    return mapRequest(
      row as Record<string, unknown>,
      vendors?.business_name ?? null,
    );
  });
}

export async function updateTableRequest(
  id: string,
  update: {
    status?: TableRequestStatus;
    assignedVendorId?: string | null;
    quoteAmount?: number | null;
    quoteNote?: string | null;
    vendorQuoteAmount?: number | null;
    vendorQuoteNote?: string | null;
  },
): Promise<TableRequest> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (update.vendorQuoteAmount !== undefined) {
    payload.vendor_quote_amount = update.vendorQuoteAmount;
    payload.vendor_quoted_at =
      update.vendorQuoteAmount != null ? new Date().toISOString() : null;
  }
  if (update.vendorQuoteNote !== undefined) {
    payload.vendor_quote_note = update.vendorQuoteNote;
  }
  if (update.status != null) payload.status = update.status;
  if (update.assignedVendorId !== undefined) {
    payload.assigned_vendor_id = update.assignedVendorId;
  }
  if (update.quoteAmount !== undefined) {
    payload.quote_amount = update.quoteAmount;
  }
  if (update.quoteNote !== undefined) {
    payload.quote_note = update.quoteNote;
  }

  const { data, error } = await db()
    .from("table_requests")
    .update(payload)
    .eq("id", id)
    .select("*, vendors(business_name)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update request.");
  }
  const vendors = data.vendors as { business_name?: string } | null;
  return mapRequest(
    data as Record<string, unknown>,
    vendors?.business_name ?? null,
  );
}

export async function listTableRequestMessages(
  requestId: string,
  channel: ChatChannel,
): Promise<TableRequestMessage[]> {
  const { data, error } = await db()
    .from("table_request_messages")
    .select("*")
    .eq("request_id", requestId)
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function insertTableRequestMessage(input: {
  requestId: string;
  senderId?: string | null;
  senderRole: TableSenderRole;
  senderName: string;
  body: string;
  channel: ChatChannel;
}): Promise<TableRequestMessage> {
  const { data, error } = await db()
    .from("table_request_messages")
    .insert({
      request_id: input.requestId,
      sender_id: input.senderId ?? null,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
      channel: input.channel,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not send message.");
  }

  await db()
    .from("table_requests")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.requestId);

  return mapMessage(data as Record<string, unknown>);
}
