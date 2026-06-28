import { randomBytes } from "crypto";
import type { ConciergeRequest, CreateConciergePayload } from "@/types/concierge";

const requests = new Map<string, ConciergeRequest>();

function generateReference() {
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `CON-${r}`;
}

export function createConciergeRequest(
  payload: CreateConciergePayload,
): ConciergeRequest {
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

export function getConciergeRequest(id: string): ConciergeRequest | null {
  return requests.get(id) ?? null;
}
