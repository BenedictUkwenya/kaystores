import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type {
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
  status: string;
  created_at: string;
};

function mapRow(row: ConciergeRow): ConciergeRequest {
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
    attachmentNames: row.attachment_names ?? [],
    status: row.status as ConciergeRequest["status"],
    createdAt: row.created_at,
  };
}

function createInMemory(payload: CreateConciergePayload): ConciergeRequest {
  const id = crypto.randomUUID();
  const request: ConciergeRequest = {
    id,
    referenceNumber: generateReference(),
    ...payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.set(id, request);
  return request;
}

export async function createConciergeRequest(
  payload: CreateConciergePayload,
): Promise<ConciergeRequest> {
  const referenceNumber = generateReference();

  if (getSupabaseConfig().isConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("concierge_requests")
        .insert({
          reference_number: referenceNumber,
          product_name: payload.productName,
          brand: payload.brand,
          budget: payload.budget,
          description: payload.description,
          contact_name: payload.contactName,
          contact_email: payload.contactEmail,
          contact_phone: payload.contactPhone,
          attachment_names: payload.attachmentNames,
        })
        .select("*")
        .single();

      if (!error && data) {
        return mapRow(data as ConciergeRow);
      }
      console.error("[concierge] Supabase insert failed:", error?.message);
    } catch (err) {
      console.error("[concierge] Supabase error:", err);
    }
  }

  return createInMemory(payload);
}

export async function getConciergeRequest(
  id: string,
): Promise<ConciergeRequest | null> {
  if (getSupabaseConfig().isConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("concierge_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) return mapRow(data as ConciergeRow);
  }
  return requests.get(id) ?? null;
}
