import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapVendorRow } from "@/lib/auth/roles";
import type { Vendor, VendorOrderItem } from "@/types/dashboard";
import { getProductSegment } from "@/lib/pricing/segment";
import type { Product } from "@/types/product";
import { mapProductRow } from "@/types/product";
import type { OrderItem } from "@/types/order";
import {
  formatDuplicateSlugError,
  isDuplicateSlugError,
} from "@/lib/products/slug-availability";
import { slugifyProductName } from "@/lib/products/slug";
import { sanitizePlacementArrays } from "@/lib/shop/taxonomy";
import { scheduleProductEmbeddingRefresh } from "@/lib/ai/embeddings";

export async function submitVendorApplication(input: {
  userId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  catalogDescription: string;
  inviteToken?: string;
}): Promise<Vendor> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") {
      throw new Error("You are already an approved vendor.");
    }
    if (existing.status === "pending") {
      throw new Error("Your application is already under review.");
    }
  }

  if (input.inviteToken) {
    const admin = createAdminClient();
    if (!admin) throw new Error("Invite validation failed");

    const { data: invited } = await admin
      .from("vendors")
      .select("*")
      .eq("invite_token", input.inviteToken)
      .maybeSingle();

    if (invited) {
      const { data, error } = await admin
        .from("vendors")
        .update({
          user_id: input.userId,
          business_name: input.businessName,
          contact_name: input.contactName,
          contact_email: input.contactEmail,
          contact_phone: input.contactPhone,
          catalog_description: input.catalogDescription,
          status: "pending",
          invite_token: null,
        })
        .eq("id", invited.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Application failed");
      return mapVendorRow(data);
    }
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert({
      user_id: input.userId,
      business_name: input.businessName,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      catalog_description: input.catalogDescription,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapVendorRow(data);
}

export async function fetchVendorProducts(vendorId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProductRow(row));
}

export type VendorProductInput = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  specs?: Record<string, string>;
  occasions?: string[];
  recipients?: string[];
  collections?: string[];
  tags?: string[];
  inStock?: boolean;
  stockQuantity?: number;
  publish?: boolean;
  segment?: "gifting" | "after_dark";
};

function mapProductWriteError(error: { message?: string; code?: string }, slug: string): Error {
  const message = error.message ?? "Save failed";
  if (error.code === "23505" && isDuplicateSlugError(message)) {
    return new Error(formatDuplicateSlugError(slugifyProductName(slug)));
  }
  return new Error(message);
}

function deriveSegment(input: VendorProductInput): "gifting" | "after_dark" {
  if (input.segment) return input.segment;
  return getProductSegment({
    tags: input.tags ?? [],
    collections: input.collections ?? [],
  });
}

export async function createVendorProduct(
  vendorId: string,
  input: VendorProductInput,
): Promise<Product> {
  const supabase = await createClient();
  const segment = deriveSegment(input);
  const stockQuantity = Math.max(0, Math.floor(input.stockQuantity ?? 0));
  const inStock = stockQuantity > 0;
  const publish = Boolean(input.publish);
  const status = publish ? "live" : "draft";
  const placement = sanitizePlacementArrays({
    occasions: input.occasions,
    recipients: input.recipients,
    collections: input.collections,
  });

  const { data, error } = await supabase
    .from("products")
    .insert({
      vendor_id: vendorId,
      sku: input.sku,
      name: input.name,
      slug: slugifyProductName(input.slug),
      description: input.description,
      brand: input.brand,
      price: input.price,
      compare_at_price: input.compareAtPrice ?? null,
      images: input.images,
      specs: input.specs ?? {},
      occasions: placement.occasions,
      recipients: placement.recipients,
      collections: placement.collections,
      tags: [],
      in_stock: inStock,
      stock_quantity: stockQuantity,
      status,
      segment,
      ...(publish
        ? { reviewed_at: new Date().toISOString(), rejection_reason: null }
        : {}),
    })
    .select("*")
    .single();

  if (error) throw mapProductWriteError(error, input.slug);
  const product = mapProductRow(data);
  if (publish) scheduleProductEmbeddingRefresh(product.id);
  return product;
}

export async function updateVendorProduct(
  productId: string,
  vendorId: string,
  input: Partial<VendorProductInput>,
): Promise<Product> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (input.name != null) payload.name = input.name;
  if (input.slug != null) payload.slug = slugifyProductName(input.slug);
  if (input.description != null) payload.description = input.description;
  if (input.brand != null) payload.brand = input.brand;
  if (input.price != null) payload.price = input.price;
  if (input.compareAtPrice !== undefined)
    payload.compare_at_price = input.compareAtPrice;
  if (input.images != null) payload.images = input.images;
  if (input.specs != null) payload.specs = input.specs;
  if (input.occasions != null || input.recipients != null || input.collections != null) {
    const placement = sanitizePlacementArrays({
      occasions: input.occasions,
      recipients: input.recipients,
      collections: input.collections,
    });
    payload.occasions = placement.occasions;
    payload.recipients = placement.recipients;
    payload.collections = placement.collections;
  }
  if (input.stockQuantity != null) {
    const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
    payload.stock_quantity = stockQuantity;
    payload.in_stock = stockQuantity > 0;
  } else if (input.inStock != null) {
    payload.in_stock = input.inStock;
  }
  if (input.segment != null) payload.segment = input.segment;
  if (input.publish) {
    payload.status = "live";
    payload.rejection_reason = null;
    payload.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .eq("vendor_id", vendorId)
    .select("*")
    .single();

  if (error) throw mapProductWriteError(error, input.slug ?? "");
  const product = mapProductRow(data);
  if (input.publish || product.status === "live") {
    scheduleProductEmbeddingRefresh(product.id);
  }
  return product;
}

export async function publishVendorProduct(
  productId: string,
  vendorId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      status: "live",
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("vendor_id", vendorId)
    .in("status", ["draft", "rejected", "pending_review"]);
  if (error) throw new Error(error.message);
  scheduleProductEmbeddingRefresh(productId);
}

/** @deprecated Use publishVendorProduct */
export const submitProductForReview = publishVendorProduct;

function mapVendorOrderItem(
  row: Record<string, unknown>,
  order?: Record<string, unknown>,
): VendorOrderItem {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    vendorId: String(row.vendor_id),
    productId: String(row.product_id),
    productName: String(row.product_name),
    segment: row.segment as VendorOrderItem["segment"],
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
    vendorEarnings: Number(row.vendor_earnings),
    fulfillmentStatus: row.fulfillment_status as VendorOrderItem["fulfillmentStatus"],
    hubNotes: row.hub_notes != null ? String(row.hub_notes) : null,
    createdAt: String(row.created_at),
    orderNumber: order ? String(order.order_number) : undefined,
    paymentStatus: order
      ? (order.payment_status as VendorOrderItem["paymentStatus"])
      : undefined,
  };
}

export async function fetchVendorOrderItems(
  vendorId: string,
): Promise<VendorOrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_order_items")
    .select("*, orders(order_number, payment_status)")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const orders = row.orders as Record<string, unknown> | null;
    return mapVendorOrderItem(row, orders ?? undefined);
  });
}

export async function updateVendorFulfillment(
  itemId: string,
  vendorId: string,
  update: { fulfillmentStatus?: string; hubNotes?: string },
): Promise<void> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (update.fulfillmentStatus) payload.fulfillment_status = update.fulfillmentStatus;
  if (update.hubNotes !== undefined) payload.hub_notes = update.hubNotes;

  const { error } = await supabase
    .from("vendor_order_items")
    .update(payload)
    .eq("id", itemId)
    .eq("vendor_id", vendorId);
  if (error) throw new Error(error.message);
}

export async function createVendorOrderItemsFromOrder(
  orderId: string,
  items: OrderItem[],
  productVendorMap: Map<string, { vendorId: string | null; name: string; segment: string }>,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const rows = items
    .map((item) => {
      const meta = productVendorMap.get(item.productId);
      if (!meta?.vendorId) return null;
      const lineTotal = item.price * item.quantity;
      return {
        order_id: orderId,
        vendor_id: meta.vendorId,
        product_id: item.productId,
        product_name: item.name,
        segment: item.segment === "after_dark" ? "after_dark" : "gifting",
        quantity: item.quantity,
        unit_price: item.price,
        line_total: lineTotal,
        vendor_earnings: lineTotal,
        fulfillment_status: "awaiting_payment",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  if (rows.length === 0) return;

  const { data: inserted, error } = await admin
    .from("vendor_order_items")
    .insert(rows)
    .select("id, vendor_id, line_total");

  if (error) {
    console.error("[vendor_order_items]", error.message);
    return;
  }

  const earnings = (inserted ?? []).map((row) => ({
    vendor_id: row.vendor_id,
    vendor_order_item_id: row.id,
    gross_amount: row.line_total,
    platform_fee: 0,
    net_amount: row.line_total,
    status: "pending",
  }));

  if (earnings.length > 0) {
    await admin.from("vendor_earnings").insert(earnings);
  }
}

export async function markVendorItemQcPassed(itemId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("vendor_order_items")
    .update({ fulfillment_status: "qc_passed" })
    .eq("id", itemId);

  const { data: item } = await admin
    .from("vendor_order_items")
    .select("id, vendor_id, line_total")
    .eq("id", itemId)
    .single();

  if (item) {
    await admin
      .from("vendor_earnings")
      .update({ status: "available" })
      .eq("vendor_order_item_id", itemId);
  }
}

export async function getVendorWalletSummary(vendorId: string) {
  const supabase = await createClient();

  const [earningsRes, withdrawalsRes] = await Promise.all([
    supabase
      .from("vendor_earnings")
      .select("net_amount, status")
      .eq("vendor_id", vendorId),
    supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
  ]);

  const earnings = earningsRes.data ?? [];
  const pending = earnings
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + Number(e.net_amount), 0);
  const available = earnings
    .filter((e) => e.status === "available")
    .reduce((s, e) => s + Number(e.net_amount), 0);
  const paidOut = earnings
    .filter((e) => e.status === "paid_out")
    .reduce((s, e) => s + Number(e.net_amount), 0);

  return {
    pending,
    available,
    paidOut,
    withdrawals: withdrawalsRes.data ?? [],
  };
}

export async function requestWithdrawal(
  vendor: Vendor,
  amount: number,
): Promise<void> {
  const MIN_WITHDRAWAL = 10_000;
  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
  }
  if (!vendor.bankName || !vendor.accountNumber || !vendor.accountName) {
    throw new Error("Add bank details in Settings before withdrawing.");
  }

  const { available } = await getVendorWalletSummary(vendor.id);
  if (amount > available) {
    throw new Error("Insufficient available balance.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("withdrawal_requests").insert({
    vendor_id: vendor.id,
    amount,
    bank_snapshot: {
      bank_name: vendor.bankName,
      account_number: vendor.accountNumber,
      account_name: vendor.accountName,
    },
  });
  if (error) throw new Error(error.message);
}

export async function updateVendorProfile(
  vendorId: string,
  update: Partial<{
    businessName: string;
    contactName: string;
    contactPhone: string;
    catalogDescription: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>,
): Promise<Vendor> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (update.businessName) payload.business_name = update.businessName;
  if (update.contactName) payload.contact_name = update.contactName;
  if (update.contactPhone) payload.contact_phone = update.contactPhone;
  if (update.catalogDescription) payload.catalog_description = update.catalogDescription;
  if (update.bankName) payload.bank_name = update.bankName;
  if (update.accountNumber) payload.account_number = update.accountNumber;
  if (update.accountName) payload.account_name = update.accountName;

  const { data, error } = await supabase
    .from("vendors")
    .update(payload)
    .eq("id", vendorId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapVendorRow(data);
}

export async function fetchProductVendorMap(
  productIds: string[],
): Promise<Map<string, { vendorId: string | null; name: string; segment: string }>> {
  const admin = createAdminClient();
  const map = new Map<string, { vendorId: string | null; name: string; segment: string }>();
  if (!admin || productIds.length === 0) return map;

  const { data } = await admin
    .from("products")
    .select("id, vendor_id, name, segment")
    .in("id", productIds);

  for (const row of data ?? []) {
    map.set(String(row.id), {
      vendorId: row.vendor_id ? String(row.vendor_id) : null,
      name: String(row.name),
      segment: String(row.segment ?? "gifting"),
    });
  }
  return map;
}
