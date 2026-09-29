import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/roles";

/**
 * Guest access to private customer pages (orders, Kay Kitchen).
 * A signed key per record is emailed to the customer and stored as an
 * httpOnly cookie in the browser that created or unlocked the record.
 */
export type AccessScope = "order" | "table";

const COOKIE_PREFIX: Record<AccessScope, string> = {
  order: "kay_o_",
  table: "kay_t_",
};
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function secret(): string {
  const value =
    process.env.ORDER_ACCESS_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ORDER_ACCESS_SECRET is not configured.");
    }
    return "kay-dev-order-access";
  }
  return value;
}

export function accessKey(scope: AccessScope, id: string): string {
  return createHmac("sha256", secret())
    .update(`${scope}:${id}`)
    .digest("base64url")
    .slice(0, 24);
}

export function isValidAccessKey(
  scope: AccessScope,
  id: string,
  key: string | null | undefined,
) {
  if (!key) return false;
  const expected = Buffer.from(accessKey(scope, id));
  const given = Buffer.from(key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function cookieName(scope: AccessScope, id: string) {
  return `${COOKIE_PREFIX[scope]}${id.replace(/-/g, "").slice(0, 16)}`;
}

/** Remember this browser as the customer (route handlers only). */
export function grantAccess(response: NextResponse, scope: AccessScope, id: string) {
  response.cookies.set(cookieName(scope, id), accessKey(scope, id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

type Owned = { id: string; userId?: string | null; email?: string | null };

export type Viewer = "admin" | "owner" | "key";

/** Admin, the signed-in owner (user id or email), a valid key, or the cookie. */
export async function resolveViewer(
  scope: AccessScope,
  record: Owned,
  key?: string | null,
): Promise<Viewer | null> {
  if (isValidAccessKey(scope, record.id, key)) return "key";

  const jar = await cookies();
  if (isValidAccessKey(scope, record.id, jar.get(cookieName(scope, record.id))?.value)) {
    return "key";
  }

  const ctx = await getAuthContext().catch(() => null);
  if (!ctx) return null;
  if (ctx.profile.role === "admin") return "admin";
  if (record.userId && record.userId === ctx.userId) return "owner";
  const email = ctx.email?.trim().toLowerCase();
  if (email && email === record.email?.trim().toLowerCase()) return "owner";
  return null;
}

// ─── Orders ──────────────────────────────────────────────────────────────

export const orderAccessKey = (orderId: string) => accessKey("order", orderId);
export const isValidOrderAccessKey = (orderId: string, key: string | null | undefined) =>
  isValidAccessKey("order", orderId, key);
export const grantOrderAccess = (response: NextResponse, orderId: string) =>
  grantAccess(response, "order", orderId);

/** Emailed link that unlocks the order in whichever browser opens it. */
export function orderAccessPath(orderId: string, suffix: "" | "/split" | "/reveal" = "") {
  const to = suffix ? `&to=${encodeURIComponent(suffix)}` : "";
  return `/api/orders/${orderId}/open?k=${orderAccessKey(orderId)}${to}`;
}

export function resolveOrderViewer(
  order: { id: string; userId?: string | null; buyer: { email: string } },
  key?: string | null,
) {
  return resolveViewer("order", { id: order.id, userId: order.userId, email: order.buyer.email }, key);
}

// ─── Kay Kitchen ─────────────────────────────────────────────────────────

export function tableAccessPath(requestId: string) {
  return `/api/table/requests/${requestId}/open?k=${accessKey("table", requestId)}`;
}

export function resolveTableViewer(
  request: { id: string; userId?: string | null; contactEmail?: string | null },
  key?: string | null,
) {
  return resolveViewer("table", { id: request.id, userId: request.userId, email: request.contactEmail }, key);
}