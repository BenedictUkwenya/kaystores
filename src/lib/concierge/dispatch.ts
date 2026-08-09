import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyConciergeAdminAlert,
  notifyConciergeAssigned,
  notifyConciergeOfferLost,
  notifyConciergeOffersReady,
  notifyConciergeRecommendationReady,
  notifyConciergeOfferSelectedClient,
  notifyConciergeOfferWon,
} from "@/lib/email/concierge";
import {
  parseStoredAttachments,
  signConciergeAttachments,
} from "@/lib/storage/concierge-attachments";
import { markupPrice } from "@/lib/pricing/markup";
import type {
  ClientConciergeDetail,
  ClientConciergeOffer,
  ConciergeAssignmentOutcome,
  ConciergeFulfilmentStatus,
  ConciergeQueueCounts,
  ConciergeQueueFilter,
  ConciergeRequest,
  ConciergeRequestWithAssignments,
  ConciergeVendorAssignment,
  ConciergeVendorResponse,
  VendorConciergeItem,
} from "@/types/concierge";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("Admin client not configured");
  return client;
}

type ConciergeRow = {
  id: string;
  reference_number: string;
  product_name: string;
  brand: string;
  budget: number;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  attachment_names: string[];
  attachments?: unknown;
  status: string;
  admin_notes: string | null;
  dispatched_at: string | null;
  selected_assignment_id: string | null;
  recommended_assignment_id: string | null;
  recommended_at: string | null;
  client_feedback: string | null;
  client_response: string | null;
  client_selected_at: string | null;
  offers_released_at: string | null;
  auto_release_offers: boolean | null;
  contact_released_at: string | null;
  payment_status?: string | null;
  payment_amount?: number | null;
  paid_at?: string | null;
  user_id: string | null;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  concierge_request_id: string;
  vendor_id: string;
  status: string;
  vendor_notes: string;
  quoted_price: number | null;
  offer_images?: unknown;
  published_to_client?: boolean;
  outcome?: string;
  fulfilment_status?: string;
  sent_at: string;
  responded_at: string | null;
  vendors?: { business_name: string } | { business_name: string }[] | null;
};

function mapRequest(row: ConciergeRow): ConciergeRequest {
  const attachments = parseStoredAttachments(row.attachments);
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    productName: row.product_name,
    brand: row.brand,
    budget: row.budget,
    description: row.description,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    attachmentNames:
      attachments.length > 0
        ? attachments.map((item) => item.name)
        : (row.attachment_names ?? []),
    attachments,
    status: row.status as ConciergeRequest["status"],
    adminNotes: row.admin_notes,
    dispatchedAt: row.dispatched_at,
    selectedAssignmentId: row.selected_assignment_id,
    recommendedAssignmentId: row.recommended_assignment_id,
    recommendedAt: row.recommended_at,
    clientFeedback: row.client_feedback ?? "",
    clientResponse: (row.client_response ?? "none") as ConciergeRequest["clientResponse"],
    clientSelectedAt: row.client_selected_at,
    offersReleasedAt: row.offers_released_at,
    autoReleaseOffers: row.auto_release_offers ?? false,
    contactReleasedAt: row.contact_released_at,
    paymentStatus: (row.payment_status ?? "unpaid") as ConciergeRequest["paymentStatus"],
    paymentAmount: row.payment_amount ?? null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
  };
}

type VendorJoin = {
  business_name: string;
  contact_name: string;
  contact_email: string;
};

function vendorFromJoin(
  vendors: VendorJoin | VendorJoin[] | null | undefined,
): VendorJoin | undefined {
  if (!vendors) return undefined;
  return Array.isArray(vendors) ? vendors[0] : vendors;
}

function mapAssignment(row: AssignmentRow): ConciergeVendorAssignment {
  const vendor = Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
  return {
    id: row.id,
    conciergeRequestId: row.concierge_request_id,
    vendorId: row.vendor_id,
    vendorBusinessName: vendor?.business_name,
    status: row.status as ConciergeVendorResponse,
    vendorNotes: row.vendor_notes ?? "",
    quotedPrice: row.quoted_price,
    offerImages: parseStoredAttachments(row.offer_images),
    publishedToClient: Boolean(row.published_to_client),
    outcome: (row.outcome ?? "pending") as ConciergeAssignmentOutcome,
    fulfilmentStatus: (row.fulfilment_status ??
      "pending") as ConciergeFulfilmentStatus,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
  };
}

function matchesQueue(
  request: ConciergeRequestWithAssignments,
  filter: ConciergeQueueFilter,
): boolean {
  if (filter === "all") return true;

  const hasAssignments = request.assignments.length > 0;
  const hasProductOffers = request.assignments.some(
    (a) => a.status === "has_product",
  );
  const unpublishedOffers = request.assignments.some(
    (a) => a.status === "has_product" && !a.publishedToClient,
  );

  switch (filter) {
    case "needs_dispatch":
      return request.status === "pending" || !hasAssignments;
    case "awaiting_quotes":
      return request.status === "with_vendors";
    case "ready_to_release":
      return (
        hasProductOffers &&
        !request.recommendedAssignmentId &&
        ["with_vendors", "offers_ready", "revision_requested"].includes(
          request.status,
        )
      );
    case "client_deciding":
      return request.status === "client_reviewing";
    case "in_fulfilment":
      return ["vendor_selected", "in_fulfilment"].includes(request.status);
    case "closed":
      return ["completed", "closed"].includes(request.status);
    default:
      return true;
  }
}

export async function fetchConciergeQueueCounts(): Promise<ConciergeQueueCounts> {
  const { requests: all } = await fetchConciergeRequestsWithAssignments({
    skipPagination: true,
  });
  return {
    needsDispatch: all.filter((r) => matchesQueue(r, "needs_dispatch")).length,
    awaitingQuotes: all.filter((r) => matchesQueue(r, "awaiting_quotes")).length,
    readyToRelease: all.filter((r) => matchesQueue(r, "ready_to_release"))
      .length,
    clientDeciding: all.filter((r) => matchesQueue(r, "client_deciding"))
      .length,
    inFulfilment: all.filter((r) => matchesQueue(r, "in_fulfilment")).length,
    closed: all.filter((r) => matchesQueue(r, "closed")).length,
  };
}

export async function fetchConciergeRequestsWithAssignments(input?: {
  filter?: ConciergeQueueFilter;
  page?: number;
  pageSize?: number;
  skipPagination?: boolean;
}): Promise<{ requests: ConciergeRequestWithAssignments[]; total: number }> {
  const db = admin();
  const filter = input?.filter ?? "all";
  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 25;

  const { data: requests, error: reqErr } = await db
    .from("concierge_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (reqErr) throw new Error(reqErr.message);
  if (!requests?.length) return { requests: [], total: 0 };

  const ids = requests.map((r) => r.id);
  const { data: assignments, error: assignErr } = await db
    .from("concierge_vendor_assignments")
    .select("*, vendors(business_name)")
    .in("concierge_request_id", ids);

  if (assignErr) throw new Error(assignErr.message);

  const byRequest = new Map<string, ConciergeVendorAssignment[]>();
  for (const row of assignments ?? []) {
    const mapped = mapAssignment(row as AssignmentRow);
    const list = byRequest.get(mapped.conciergeRequestId) ?? [];
    list.push(mapped);
    byRequest.set(mapped.conciergeRequestId, list);
  }

  const all = (requests as ConciergeRow[]).map((row) => ({
    ...mapRequest(row),
    assignments: byRequest.get(row.id) ?? [],
  }));

  const filtered = all.filter((r) => matchesQueue(r, filter));

  if (input?.skipPagination) {
    return { requests: filtered, total: filtered.length };
  }

  const start = (page - 1) * pageSize;

  return {
    requests: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

export async function dispatchConciergeToVendors(input: {
  requestId: string;
  vendorIds: string[] | "all";
}): Promise<{ assigned: number; skipped: number }> {
  const db = admin();

  const { data: request, error: reqErr } = await db
    .from("concierge_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (reqErr || !request) throw new Error("Concierge request not found");

  let vendorIds = input.vendorIds;
  if (vendorIds === "all") {
    const { data: vendors, error: vErr } = await db
      .from("vendors")
      .select("id, business_name, contact_name, contact_email")
      .eq("status", "approved");
    if (vErr) throw new Error(vErr.message);
    if (!vendors?.length) throw new Error("No approved vendors available");
    vendorIds = vendors.map((v) => v.id);
  }

  if (!vendorIds.length) throw new Error("Select at least one vendor");

  const { data: existing } = await db
    .from("concierge_vendor_assignments")
    .select("vendor_id")
    .eq("concierge_request_id", input.requestId);

  const alreadyAssigned = new Set((existing ?? []).map((e) => e.vendor_id));
  const toAssign = vendorIds.filter((id) => !alreadyAssigned.has(id));

  if (!toAssign.length) {
    return { assigned: 0, skipped: vendorIds.length };
  }

  const rows = toAssign.map((vendorId) => ({
    concierge_request_id: input.requestId,
    vendor_id: vendorId,
  }));

  const { error: insertErr } = await db
    .from("concierge_vendor_assignments")
    .insert(rows);

  if (insertErr) throw new Error(insertErr.message);

  await db
    .from("concierge_requests")
    .update({
      status: "with_vendors",
      dispatched_at: new Date().toISOString(),
    })
    .eq("id", input.requestId);

  const { data: vendorDetails } = await db
    .from("vendors")
    .select("id, business_name, contact_name, contact_email")
    .in("id", toAssign);

  const mappedRequest = mapRequest(request as ConciergeRow);
  for (const vendor of vendorDetails ?? []) {
    void notifyConciergeAssigned(
      {
        contactName: vendor.contact_name,
        contactEmail: vendor.contact_email,
        businessName: vendor.business_name,
      },
      mappedRequest,
    );
  }

  return { assigned: toAssign.length, skipped: vendorIds.length - toAssign.length };
}

async function maybeMarkOffersReady(requestId: string): Promise<void> {
  const db = admin();

  const { data: request } = await db
    .from("concierge_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  if (
    !request ||
    ["client_reviewing", "vendor_selected", "in_fulfilment", "completed", "closed"].includes(
      request.status as string,
    )
  ) {
    return;
  }

  const { data: offers } = await db
    .from("concierge_vendor_assignments")
    .select("id")
    .eq("concierge_request_id", requestId)
    .eq("status", "has_product");

  if (!offers?.length) return;

  const previousStatus = request.status as string;
  await db
    .from("concierge_requests")
    .update({ status: "offers_ready" })
    .eq("id", requestId);

  if (previousStatus !== "offers_ready") {
    const { data: fullRequest } = await db
      .from("concierge_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (fullRequest) {
      void notifyConciergeAdminAlert(
        mapRequest(fullRequest as ConciergeRow),
        "Offers ready to present",
        "Partner vendors have submitted quotes. Review and present one offer to the client.",
      );
    }
  }
}

export async function presentOfferToClient(input: {
  requestId: string;
  assignmentId: string;
}): Promise<void> {
  const db = admin();

  const { data: request, error } = await db
    .from("concierge_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (error || !request) throw new Error("Request not found");

  const { data: assignment, error: assignErr } = await db
    .from("concierge_vendor_assignments")
    .select("id, status")
    .eq("id", input.assignmentId)
    .eq("concierge_request_id", input.requestId)
    .maybeSingle();

  if (assignErr || !assignment || assignment.status !== "has_product") {
    throw new Error("Offer not found.");
  }

  const now = new Date().toISOString();

  await db
    .from("concierge_vendor_assignments")
    .update({ published_to_client: false, outcome: "pending" })
    .eq("concierge_request_id", input.requestId);

  await db
    .from("concierge_vendor_assignments")
    .update({ published_to_client: true, outcome: "published" })
    .eq("id", input.assignmentId);

  await db
    .from("concierge_requests")
    .update({
      recommended_assignment_id: input.assignmentId,
      recommended_at: now,
      offers_released_at: now,
      client_feedback: "",
      client_response: "pending",
      status: "client_reviewing",
    })
    .eq("id", input.requestId);

  const mapped = mapRequest(request as ConciergeRow);
  void notifyConciergeRecommendationReady(mapped);
}

/** @deprecated Use presentOfferToClient — admin picks one offer for the client */
export async function releaseOffersToClient(requestId: string): Promise<void> {
  throw new Error("Release all offers is disabled. Present one offer to the client instead.");
}

export async function respondToConciergeAssignment(input: {
  assignmentId: string;
  vendorId: string;
  requestId: string;
  status: Exclude<ConciergeVendorResponse, "pending">;
  vendorNotes?: string;
  quotedPrice?: number | null;
  offerImages?: import("@/types/concierge").ConciergeAttachment[];
}): Promise<void> {
  const db = admin();

  const { data: assignment, error: fetchErr } = await db
    .from("concierge_vendor_assignments")
    .select("id, vendor_id, concierge_request_id")
    .eq("id", input.assignmentId)
    .maybeSingle();

  if (fetchErr || !assignment) throw new Error("Assignment not found");
  if (assignment.vendor_id !== input.vendorId) throw new Error("Forbidden");

  const update: Record<string, unknown> = {
    status: input.status,
    vendor_notes: input.vendorNotes ?? "",
    quoted_price: input.quotedPrice ?? null,
    responded_at: new Date().toISOString(),
  };

  if (input.offerImages?.length) {
    update.offer_images = input.offerImages;
  }

  const { error } = await db
    .from("concierge_vendor_assignments")
    .update(update)
    .eq("id", input.assignmentId);

  if (error) throw new Error(error.message);

  if (input.status === "has_product") {
    await maybeMarkOffersReady(assignment.concierge_request_id);
  }
}

export async function acceptClientRecommendation(input: {
  requestId: string;
  userId?: string;
  email?: string;
}): Promise<void> {
  const db = admin();

  const { data: request, error: reqErr } = await db
    .from("concierge_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (reqErr || !request) throw new Error("Request not found");

  const row = request as ConciergeRow;
  const assignmentId = row.recommended_assignment_id;
  if (!assignmentId) {
    throw new Error("No recommendation is available to accept.");
  }

  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
  const emailMatch =
    normalizedEmail &&
    row.contact_email.trim().toLowerCase() === normalizedEmail;
  const userMatch = input.userId && row.user_id === input.userId;

  if (!emailMatch && !userMatch) {
    throw new Error("Forbidden");
  }

  if (row.selected_assignment_id) {
    throw new Error("This recommendation was already accepted.");
  }

  if (row.status !== "client_reviewing" || row.client_response !== "pending") {
    throw new Error("This recommendation is not available.");
  }

  await finalizeOfferSelection(row, assignmentId);
}

/** @deprecated Use acceptClientRecommendation */
export async function selectClientOffer(input: {
  requestId: string;
  assignmentId: string;
  userId?: string;
  email?: string;
}): Promise<void> {
  const db = admin();
  const { data: request } = await db
    .from("concierge_requests")
    .select("recommended_assignment_id")
    .eq("id", input.requestId)
    .maybeSingle();

  if (request?.recommended_assignment_id !== input.assignmentId) {
    throw new Error("Only Kay's recommended offer can be accepted.");
  }

  await acceptClientRecommendation({
    requestId: input.requestId,
    userId: input.userId,
    email: input.email,
  });
}

async function finalizeOfferSelection(
  row: ConciergeRow,
  assignmentId: string,
): Promise<void> {
  const db = admin();

  const { data: assignment, error: assignErr } = await db
    .from("concierge_vendor_assignments")
    .select("*, vendors(business_name, contact_name, contact_email)")
    .eq("id", assignmentId)
    .eq("concierge_request_id", row.id)
    .maybeSingle();

  if (assignErr || !assignment) throw new Error("Offer not found");

  const assignRow = assignment as AssignmentRow & {
    vendors?: VendorJoin | VendorJoin[] | null;
  };

  const now = new Date().toISOString();

  await db
    .from("concierge_vendor_assignments")
    .update({ outcome: "selected", fulfilment_status: "pending" })
    .eq("id", assignmentId);

  await db
    .from("concierge_vendor_assignments")
    .update({ outcome: "not_chosen" })
    .eq("concierge_request_id", row.id)
    .neq("id", assignmentId);

  await db
    .from("concierge_requests")
    .update({
      selected_assignment_id: assignmentId,
      client_selected_at: now,
      client_response: "accepted",
      status: "vendor_selected",
    })
    .eq("id", row.id);

  const mappedRequest = mapRequest(row);
  const vendor = vendorFromJoin(assignRow.vendors);

  void notifyConciergeOfferSelectedClient(mappedRequest, {
    vendorBusinessName: vendor?.business_name ?? "Kay partner",
    quotedPrice: await markupPrice(assignRow.quoted_price ?? 0),
  });

  if (vendor) {
    void notifyConciergeOfferWon(
      {
        contactName: vendor.contact_name,
        contactEmail: vendor.contact_email,
        businessName: vendor.business_name,
      },
      mappedRequest,
    );
  }

  const { data: losers } = await db
    .from("concierge_vendor_assignments")
    .select("vendors(business_name, contact_name, contact_email)")
    .eq("concierge_request_id", row.id)
    .eq("outcome", "not_chosen")
    .eq("status", "has_product");

  for (const loser of losers ?? []) {
    const vendorInfo = vendorFromJoin(
      (loser as { vendors?: VendorJoin | VendorJoin[] | null }).vendors,
    );
    if (vendorInfo) {
      void notifyConciergeOfferLost(
        {
          contactName: vendorInfo.contact_name,
          contactEmail: vendorInfo.contact_email,
          businessName: vendorInfo.business_name,
        },
        mappedRequest,
      );
    }
  }
}

export async function respondToClientRecommendation(input: {
  requestId: string;
  action: "revise" | "cancel";
  feedback?: string;
  userId?: string;
  email?: string;
}): Promise<void> {
  const db = admin();

  const { data: request, error: reqErr } = await db
    .from("concierge_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (reqErr || !request) throw new Error("Request not found");

  const row = request as ConciergeRow;
  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
  const emailMatch =
    normalizedEmail &&
    row.contact_email.trim().toLowerCase() === normalizedEmail;
  const userMatch = input.userId && row.user_id === input.userId;

  if (!emailMatch && !userMatch) {
    throw new Error("Forbidden");
  }

  if (row.status !== "client_reviewing" || row.client_response !== "pending") {
    throw new Error("No active recommendation to respond to.");
  }

  if (input.action === "cancel") {
    await db
      .from("concierge_vendor_assignments")
      .update({ published_to_client: false, outcome: "pending" })
      .eq("concierge_request_id", input.requestId);

    await db
      .from("concierge_requests")
      .update({
        status: "closed",
        client_response: "cancelled",
        client_feedback: input.feedback?.trim() ?? "",
        recommended_assignment_id: null,
      })
      .eq("id", input.requestId);
    return;
  }

  const feedback = input.feedback?.trim() ?? "";
  if (!feedback) {
    throw new Error("Please describe what you are looking for.");
  }

  await db
    .from("concierge_vendor_assignments")
    .update({ published_to_client: false, outcome: "pending" })
    .eq("concierge_request_id", input.requestId);

  await db
    .from("concierge_requests")
    .update({
      status: "revision_requested",
      client_response: "needs_revision",
      client_feedback: feedback,
      recommended_assignment_id: null,
      recommended_at: null,
    })
    .eq("id", input.requestId);

  void notifyConciergeAdminAlert(
    mapRequest(row),
    "Client requested changes",
    feedback,
  );
}

export async function updateConciergeFulfilment(input: {
  assignmentId: string;
  vendorId: string;
  fulfilmentStatus: ConciergeFulfilmentStatus;
}): Promise<void> {
  const db = admin();

  const { data: assignment, error: fetchErr } = await db
    .from("concierge_vendor_assignments")
    .select("id, vendor_id, outcome, concierge_request_id")
    .eq("id", input.assignmentId)
    .maybeSingle();

  if (fetchErr || !assignment) throw new Error("Assignment not found");
  if (assignment.vendor_id !== input.vendorId) throw new Error("Forbidden");
  if (assignment.outcome !== "selected") {
    throw new Error("Only selected offers can be fulfilled.");
  }

  const { data: request, error: paymentErr } = await db
    .from("concierge_requests")
    .select("payment_status")
    .eq("id", assignment.concierge_request_id)
    .maybeSingle();

  if (
    !paymentErr?.message.includes("payment_status") &&
    request?.payment_status !== "paid"
  ) {
    throw new Error("Client payment is required before fulfilment.");
  }

  await db
    .from("concierge_vendor_assignments")
    .update({ fulfilment_status: input.fulfilmentStatus })
    .eq("id", input.assignmentId);

  if (input.fulfilmentStatus === "sourcing") {
    await db
      .from("concierge_requests")
      .update({ status: "in_fulfilment" })
      .eq("id", assignment.concierge_request_id);
  }

  if (input.fulfilmentStatus === "at_hub") {
    await db
      .from("concierge_requests")
      .update({ status: "in_fulfilment" })
      .eq("id", assignment.concierge_request_id);
  }

  if (input.fulfilmentStatus === "completed") {
    await db
      .from("concierge_requests")
      .update({ status: "completed" })
      .eq("id", assignment.concierge_request_id);
  }
}

export async function releaseClientContact(requestId: string): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("concierge_requests")
    .update({ contact_released_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}

export async function fetchClientConciergeDetail(
  requestId: string,
): Promise<ClientConciergeDetail | null> {
  const db = admin();

  const { data: request } = await db
    .from("concierge_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return null;

  const mapped = mapRequest(request as ConciergeRow);

  let recommendedOffer: ClientConciergeOffer | null = null;

  if (mapped.recommendedAssignmentId && !mapped.selectedAssignmentId) {
    const { data: row } = await db
      .from("concierge_vendor_assignments")
      .select("*, vendors(business_name)")
      .eq("id", mapped.recommendedAssignmentId)
      .eq("concierge_request_id", requestId)
      .maybeSingle();

    if (row) {
      const a = mapAssignment(row as AssignmentRow);
      const signedImages = await signConciergeAttachments(a.offerImages);
      recommendedOffer = {
        assignmentId: a.id,
        vendorBusinessName: "Kay curated selection",
        quotedPrice: await markupPrice(a.quotedPrice ?? 0),
        vendorNotes: a.vendorNotes,
        offerImages: signedImages,
        outcome: a.outcome,
      };
    }
  }

  let acceptedOffer: ClientConciergeOffer | null = null;
  if (mapped.selectedAssignmentId) {
    const { data: row } = await db
      .from("concierge_vendor_assignments")
      .select("*, vendors(business_name)")
      .eq("id", mapped.selectedAssignmentId)
      .maybeSingle();

    if (row) {
      const a = mapAssignment(row as AssignmentRow);
      const signedImages = await signConciergeAttachments(a.offerImages);
      acceptedOffer = {
        assignmentId: a.id,
        vendorBusinessName: "Kay curated selection",
        quotedPrice: await markupPrice(a.quotedPrice ?? 0),
        vendorNotes: a.vendorNotes,
        offerImages: signedImages,
        outcome: a.outcome,
      };
    }
  }

  const displayOffer = acceptedOffer ?? recommendedOffer;
  const paymentStatus = mapped.paymentStatus ?? "unpaid";
  const paymentBreakdown = displayOffer
    ? { clientPrice: displayOffer.quotedPrice }
    : null;

  const canAccept =
    !mapped.selectedAssignmentId &&
    mapped.status === "client_reviewing" &&
    mapped.clientResponse === "pending" &&
    Boolean(recommendedOffer);

  const canRevise = canAccept;
  const canCancel = canAccept;

  const canPay =
    Boolean(acceptedOffer) &&
    paymentStatus !== "paid" &&
    ["vendor_selected", "in_fulfilment"].includes(mapped.status);

  return {
    id: mapped.id,
    referenceNumber: mapped.referenceNumber,
    productName: mapped.productName,
    brand: mapped.brand,
    budget: mapped.budget,
    status: mapped.status,
    createdAt: mapped.createdAt,
    description: mapped.description,
    recommendedOffer: displayOffer,
    selectedAssignmentId: mapped.selectedAssignmentId ?? null,
    canAccept,
    canRevise,
    canCancel,
    paymentStatus,
    canPay,
    paymentBreakdown,
  };
}

export async function fetchVendorConciergeItems(
  vendorId: string,
): Promise<VendorConciergeItem[]> {
  const db = admin();

  const requestFieldsWithPayment = `
        id,
        reference_number,
        product_name,
        brand,
        budget,
        description,
        attachment_names,
        attachments,
        payment_status
      `;

  const requestFieldsBase = `
        id,
        reference_number,
        product_name,
        brand,
        budget,
        description,
        attachment_names,
        attachments
      `;

  const assignmentSelect = (requestFields: string) => `
      id,
      status,
      vendor_notes,
      quoted_price,
      offer_images,
      outcome,
      fulfilment_status,
      sent_at,
      responded_at,
      concierge_requests!concierge_vendor_assignments_concierge_request_id_fkey (
        ${requestFields}
      )
    `;

  type VendorAssignmentQueryRow = {
    id: string;
    status: string;
    vendor_notes: string;
    quoted_price: number | null;
    offer_images?: unknown;
    outcome?: string;
    fulfilment_status?: string;
    sent_at: string;
    responded_at: string | null;
    concierge_requests:
      | {
          id: string;
          reference_number: string;
          product_name: string;
          brand: string;
          budget: number;
          description: string;
          attachment_names: string[];
          attachments?: unknown;
          payment_status?: string;
        }
      | null
      | Array<{
          id: string;
          reference_number: string;
          product_name: string;
          brand: string;
          budget: number;
          description: string;
          attachment_names: string[];
          attachments?: unknown;
          payment_status?: string;
        }>;
  };

  const withPayment = await db
    .from("concierge_vendor_assignments")
    .select(assignmentSelect(requestFieldsWithPayment))
    .eq("vendor_id", vendorId)
    .order("sent_at", { ascending: false });

  let rows = withPayment.data as VendorAssignmentQueryRow[] | null;
  let fetchError = withPayment.error;

  if (fetchError?.message.includes("payment_status")) {
    const fallback = await db
      .from("concierge_vendor_assignments")
      .select(assignmentSelect(requestFieldsBase))
      .eq("vendor_id", vendorId)
      .order("sent_at", { ascending: false });
    rows = fallback.data as VendorAssignmentQueryRow[] | null;
    fetchError = fallback.error;
  }

  if (fetchError) throw new Error(fetchError.message);

  return (rows ?? []).flatMap((row: VendorAssignmentQueryRow) => {
    const req = row.concierge_requests;
    const request = Array.isArray(req) ? req[0] : req;
    if (!request) return [];

    const referenceAttachments = parseStoredAttachments(request.attachments);

    return [
      {
        assignmentId: row.id,
        requestId: request.id,
        referenceNumber: request.reference_number,
        productName: request.product_name,
        brand: request.brand,
        budget: request.budget,
        description: request.description,
        attachmentNames: request.attachment_names ?? [],
        referenceAttachments,
        status: row.status as ConciergeVendorResponse,
        vendorNotes: row.vendor_notes ?? "",
        quotedPrice: row.quoted_price,
        offerImages: parseStoredAttachments(row.offer_images),
        outcome: (row.outcome ?? "pending") as ConciergeAssignmentOutcome,
        fulfilmentStatus: (row.fulfilment_status ??
          "pending") as ConciergeFulfilmentStatus,
        requestPaymentStatus: (request.payment_status ??
          "unpaid") as VendorConciergeItem["requestPaymentStatus"],
        sentAt: row.sent_at,
        respondedAt: row.responded_at,
      },
    ];
  });
}
