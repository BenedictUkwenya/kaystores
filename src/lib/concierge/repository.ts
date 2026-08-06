import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type {
  ClientConciergeStatus,
  ConciergeAttachment,
  ConciergeRequest,
  CreateConciergePayload,
} from "@/types/concierge";
import { randomBytes } from "crypto";

const requests = new Map<string, ConciergeRequest>();

function generateReference() {
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `CON-${r}`;
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
  user_id: string | null;
  created_at: string;
};

function parseAttachments(row: ConciergeRow): ConciergeAttachment[] {
  if (Array.isArray(row.attachments)) {
    return row.attachments.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const name = String(record.name ?? "");
      const path = String(record.path ?? "");
      if (!name || !path) return [];
      return [
        {
          name,
          path,
          contentType: String(record.contentType ?? "application/octet-stream"),
        },
      ];
    });
  }
  return [];
}

function mapRow(row: ConciergeRow): ConciergeRequest {
  const attachments = parseAttachments(row);
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
    userId: row.user_id,
    autoReleaseOffers: false,
    createdAt: row.created_at,
  };
}

function createInMemory(
  payload: CreateConciergePayload,
  userId?: string | null,
): ConciergeRequest {
  const id = payload.id ?? crypto.randomUUID();
  const request: ConciergeRequest = {
    id,
    referenceNumber: generateReference(),
    ...payload,
    attachments: payload.attachments ?? [],
    userId: userId ?? null,
    autoReleaseOffers: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.set(id, request);
  return request;
}

export async function createConciergeRequest(
  payload: CreateConciergePayload,
  userId?: string | null,
): Promise<ConciergeRequest> {
  const referenceNumber = generateReference();
  const requestId = payload.id ?? crypto.randomUUID();
  const attachments = payload.attachments ?? [];

  const row: Record<string, unknown> = {
    id: requestId,
    reference_number: referenceNumber,
    product_name: payload.productName,
    brand: payload.brand,
    budget: payload.budget,
    description: payload.description,
    contact_name: payload.contactName,
    contact_email: payload.contactEmail.trim().toLowerCase(),
    contact_phone: payload.contactPhone,
    attachment_names:
      attachments.length > 0
        ? attachments.map((item) => item.name)
        : payload.attachmentNames,
    attachments,
  };

  if (getSupabaseConfig().isConfigured) {
    const admin = createAdminClient();
    if (!admin) {
      throw new Error("Concierge storage is not configured.");
    }

    const withUser = userId ? { ...row, user_id: userId } : row;
    let { data, error } = await admin
      .from("concierge_requests")
      .insert(withUser)
      .select("*")
      .single();

    if (
      error &&
      (error.message.includes("attachments") ||
        error.message.includes("column"))
    ) {
      const { attachments: _removed, ...withoutAttachments } = row;
      ({ data, error } = await admin
        .from("concierge_requests")
        .insert(withoutAttachments)
        .select("*")
        .single());
    }

    if (
      error &&
      userId &&
      (error.message.includes("user_id") ||
        error.message.includes("column"))
    ) {
      ({ data, error } = await admin
        .from("concierge_requests")
        .insert(row)
        .select("*")
        .single());
    }

    if (error) {
      console.error("[concierge] insert failed:", error.message);
      throw new Error("Could not save your request. Please try again.");
    }

    if (data) {
      return mapRow(data as ConciergeRow);
    }
  }

  if (!getSupabaseConfig().isConfigured) {
    return createInMemory(payload, userId);
  }

  throw new Error("Could not save your request. Please try again.");
}

export async function getConciergeRequest(
  id: string,
): Promise<ConciergeRequest | null> {
  if (getSupabaseConfig().isConfigured) {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin
        .from("concierge_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) return mapRow(data as ConciergeRow);
    }
  }
  return requests.get(id) ?? null;
}

export async function lookupConciergeRequest(
  referenceNumber: string,
  email: string,
): Promise<ConciergeRequest | null> {
  const normalizedRef = referenceNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (getSupabaseConfig().isConfigured) {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin
        .from("concierge_requests")
        .select("*")
        .eq("reference_number", normalizedRef)
        .maybeSingle();

      if (data) {
        const row = data as ConciergeRow;
        if (row.contact_email.trim().toLowerCase() === normalizedEmail) {
          return mapRow(row);
        }
      }
    }
    return null;
  }

  for (const request of requests.values()) {
    if (
      request.referenceNumber.toUpperCase() === normalizedRef &&
      request.contactEmail.trim().toLowerCase() === normalizedEmail
    ) {
      return request;
    }
  }

  return null;
}

export async function fetchConciergeRequestsForAccount(input: {
  userId?: string;
  email?: string;
}): Promise<ClientConciergeStatus[]> {
  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
  if (!input.userId && !normalizedEmail) return [];

  if (getSupabaseConfig().isConfigured) {
    const admin = createAdminClient();
    if (!admin) return [];

    const rows = new Map<string, ConciergeRow>();

    if (input.userId) {
      const { data, error } = await admin
        .from("concierge_requests")
        .select("*")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false });

      if (error) {
        // user_id column may not exist until migration 017 is applied
        console.warn("[concierge] user_id fetch:", error.message);
      } else {
        for (const row of data ?? []) {
          rows.set(String(row.id), row as ConciergeRow);
        }
      }
    }

    if (normalizedEmail) {
      const { data, error } = await admin
        .from("concierge_requests")
        .select("*")
        .eq("contact_email", normalizedEmail)
        .order("created_at", { ascending: false });

      if (error) {
        // Column or data mismatch — fall back to case-insensitive scan
        const { data: allRows } = await admin
          .from("concierge_requests")
          .select("*")
          .order("created_at", { ascending: false });

        for (const row of allRows ?? []) {
          if (
            String(row.contact_email).trim().toLowerCase() === normalizedEmail
          ) {
            rows.set(String(row.id), row as ConciergeRow);
          }
        }
      } else {
        for (const row of data ?? []) {
          rows.set(String(row.id), row as ConciergeRow);
        }
      }
    }

    return [...rows.values()]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((row) => toClientConciergeStatus(mapRow(row)));
  }

  return [...requests.values()]
    .filter((request) => {
      if (input.userId && request.userId === input.userId) return true;
      if (
        normalizedEmail &&
        request.contactEmail.trim().toLowerCase() === normalizedEmail
      ) {
        return true;
      }
      return false;
    })
    .map(toClientConciergeStatus);
}

/** @deprecated Use fetchConciergeRequestsForAccount */
export async function fetchConciergeRequestsForEmail(
  email: string,
): Promise<ClientConciergeStatus[]> {
  return fetchConciergeRequestsForAccount({ email });
}

export function toClientConciergeStatus(
  request: ConciergeRequest,
): ClientConciergeStatus {
  return {
    id: request.id,
    referenceNumber: request.referenceNumber,
    productName: request.productName,
    brand: request.brand,
    budget: request.budget,
    status: request.status,
    createdAt: request.createdAt,
  };
}
