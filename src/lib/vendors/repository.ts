import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapVendorRow } from "@/lib/auth/roles";
import type { Vendor, VendorOrderItem } from "@/types/dashboard";
import { getProductSegment } from "@/lib/pricing/segment";
import type { Product } from "@/types/product";
import { mapProductRow } from "@/types/product";
import type { AddressDetails, OrderItem } from "@/types/order";
import {
  formatDuplicateSlugError,
  isDuplicateSlugError,
} from "@/lib/products/slug-availability";
import { slugifyProductName } from "@/lib/products/slug";
import { sanitizePlacementArrays } from "@/lib/shop/taxonomy";
import { buildSearchKeywords } from "@/lib/products/catalog-attributes";
import { scheduleProductEmbeddingRefresh } from "@/lib/ai/embeddings";
import { isValidNin, normalizeNin } from "@/lib/vendor/nin";

export async function submitVendorApplication(input: {
  userId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  catalogDescription: string;
  nin?: string;
  inviteToken?: string;
}): Promise<Vendor> {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!admin) throw new Error("Application failed");

  const nin = input.nin ? normalizeNin(input.nin) : "";
  const now = new Date().toISOString();
  const dbAdmin = admin;

  async function approveInviteVendor(
    vendorId: string,
    invitedBy: string | null,
  ): Promise<Vendor> {
    const { data, error } = await dbAdmin
      .from("vendors")
      .update({
        user_id: input.userId,
        business_name: input.businessName,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        catalog_description: input.catalogDescription,
        status: "approved",
        onboarding_source: "invite",
        invite_token: null,
        nin: nin || null,
        approved_at: now,
        approved_by: invitedBy,
        updated_at: now,
      })
      .eq("id", vendorId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Application failed");

    await dbAdmin
      .from("profiles")
      .update({ role: "vendor", updated_at: now })
      .eq("id", input.userId);

    return mapVendorRow(data);
  }

  const { data: existing } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  let invitedByToken: Record<string, unknown> | null = null;
  if (input.inviteToken) {
    const { data } = await admin
      .from("vendors")
      .select("*")
      .eq("invite_token", input.inviteToken)
      .maybeSingle();
    invitedByToken = data;
  }

  const isInvitePath =
    Boolean(input.inviteToken?.trim()) ||
    Boolean(invitedByToken) ||
    (existing?.onboarding_source === "invite" &&
      existing.status !== "approved");

  if (!isInvitePath && !isValidNin(nin)) {
    throw new Error("Enter a valid 11-digit NIN.");
  }

  if (existing) {
    if (existing.status === "approved") {
      throw new Error("You are already an approved vendor.");
    }
    if (existing.status === "pending" && existing.onboarding_source !== "invite") {
      throw new Error("Your application is already under review.");
    }

    if (isInvitePath) {
      return approveInviteVendor(
        existing.id,
        existing.invited_by ? String(existing.invited_by) : null,
      );
    }

    const { data, error } = await admin
      .from("vendors")
      .update({
        business_name: input.businessName,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        catalog_description: input.catalogDescription,
        nin,
        status: "pending",
        onboarding_source: "self_apply",
        invite_token: null,
      })
      .eq("user_id", input.userId)
      .select("*")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Application failed");
    return mapVendorRow(data);
  }

  if (invitedByToken) {
    return approveInviteVendor(
      String(invitedByToken.id),
      invitedByToken.invited_by
        ? String(invitedByToken.invited_by)
        : null,
    );
  }

  if (input.inviteToken) {
    const { data: byUser } = await admin
      .from("vendors")
      .select("*")
      .eq("user_id", input.userId)
      .eq("onboarding_source", "invite")
      .maybeSingle();

    if (byUser && byUser.status !== "approved") {
      return approveInviteVendor(
        byUser.id,
        byUser.invited_by ? String(byUser.invited_by) : null,
      );
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
      nin,
      status: "pending",
      onboarding_source: "self_apply",
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
  /** Vendor payout unit price — independent of shop display/list price. */
  vendorOriginalPrice?: number | null;
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
  shippingWeightKg?: number;
  shippingLengthCm?: number;
  shippingWidthCm?: number;
  shippingHeightCm?: number;
  productType?: string | null;
  masterCategory?: string | null;
  color?: string | null;
  condition?: string | null;
  audience?: string | null;
  sizeOptions?: string[];
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
  vendorId: string | null,
  input: VendorProductInput,
  db?: SupabaseClient,
): Promise<Product> {
  const supabase = db ?? (await createClient());
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
  const searchKeywords = buildSearchKeywords({
    productType: input.productType,
    masterCategory: input.masterCategory,
    color: input.color,
    condition: input.condition,
    audience: input.audience,
    brand: input.brand,
    name: input.name,
    specs: input.specs,
    sizeOptions: input.sizeOptions,
  });
  const vendorOriginalPrice =
    input.vendorOriginalPrice != null && input.vendorOriginalPrice > 0
      ? Math.floor(input.vendorOriginalPrice)
      : Math.floor(input.price);

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
      vendor_original_price: vendorOriginalPrice,
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
      shipping_weight_kg: input.shippingWeightKg ?? null,
      shipping_length_cm: input.shippingLengthCm ?? null,
      shipping_width_cm: input.shippingWidthCm ?? null,
      shipping_height_cm: input.shippingHeightCm ?? null,
      product_type: input.productType ?? null,
      master_category: input.masterCategory ?? null,
      color: input.color ?? null,
      condition: input.condition ?? null,
      audience: input.audience ?? null,
      size_options: input.sizeOptions ?? [],
      search_keywords: searchKeywords,
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

export async function createVendorProductAdmin(
  vendorId: string | null,
  input: VendorProductInput,
): Promise<Product> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Database is not configured.");
  return createVendorProduct(vendorId, input, admin);
}

export async function fetchProductSkuAndSlugSets(): Promise<{
  skus: Set<string>;
  slugs: Set<string>;
}> {
  const admin = createAdminClient();
  if (!admin) return { skus: new Set(), slugs: new Set() };
  const { data, error } = await admin.from("products").select("sku, slug");
  if (error) throw new Error(error.message);
  const skus = new Set<string>();
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    if (row.sku) skus.add(String(row.sku).trim().toLowerCase());
    if (row.slug) slugs.add(String(row.slug).trim().toLowerCase());
  }
  return { skus, slugs };
}

export async function updateVendorProduct(
  productId: string,
  vendorId: string | null,
  input: Partial<VendorProductInput>,
  db?: SupabaseClient,
): Promise<Product> {
  const supabase = db ?? (await createClient());
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
  if (input.shippingWeightKg != null) payload.shipping_weight_kg = input.shippingWeightKg;
  if (input.shippingLengthCm != null) payload.shipping_length_cm = input.shippingLengthCm;
  if (input.shippingWidthCm != null) payload.shipping_width_cm = input.shippingWidthCm;
  if (input.shippingHeightCm != null) payload.shipping_height_cm = input.shippingHeightCm;
  if (input.vendorOriginalPrice !== undefined) {
    payload.vendor_original_price =
      input.vendorOriginalPrice != null && input.vendorOriginalPrice > 0
        ? Math.floor(input.vendorOriginalPrice)
        : input.price != null
          ? Math.floor(input.price)
          : null;
  }
  if (input.productType !== undefined) payload.product_type = input.productType;
  if (input.masterCategory !== undefined)
    payload.master_category = input.masterCategory;
  if (input.color !== undefined) payload.color = input.color;
  if (input.condition !== undefined) payload.condition = input.condition;
  if (input.audience !== undefined) payload.audience = input.audience;
  if (input.sizeOptions !== undefined) payload.size_options = input.sizeOptions;

  const shouldRefreshKeywords =
    input.name != null ||
    input.brand != null ||
    input.productType !== undefined ||
    input.masterCategory !== undefined ||
    input.color !== undefined ||
    input.condition !== undefined ||
    input.audience !== undefined ||
    input.specs != null ||
    input.sizeOptions !== undefined;

  if (shouldRefreshKeywords) {
    // Load current row so partial updates still rebuild a full keyword set.
    let queryCurrent = supabase.from("products").select("*").eq("id", productId);
    queryCurrent = vendorId
      ? queryCurrent.eq("vendor_id", vendorId)
      : queryCurrent.is("vendor_id", null);
    const { data: current } = await queryCurrent.maybeSingle();
    if (current) {
      payload.search_keywords = buildSearchKeywords({
        productType:
          input.productType !== undefined
            ? input.productType
            : (current.product_type as string | null),
        masterCategory:
          input.masterCategory !== undefined
            ? input.masterCategory
            : (current.master_category as string | null),
        color:
          input.color !== undefined ? input.color : (current.color as string | null),
        condition:
          input.condition !== undefined
            ? input.condition
            : (current.condition as string | null),
        audience:
          input.audience !== undefined
            ? input.audience
            : (current.audience as string | null),
        brand: input.brand ?? String(current.brand ?? ""),
        name: input.name ?? String(current.name ?? ""),
        specs:
          input.specs ??
          ((current.specs as Record<string, string> | null) ?? {}),
        sizeOptions:
          input.sizeOptions ??
          (Array.isArray(current.size_options)
            ? (current.size_options as string[])
            : []),
      });
    }
  }

  if (input.publish) {
    payload.status = "live";
    payload.rejection_reason = null;
    payload.reviewed_at = new Date().toISOString();
  }

  let query = supabase
    .from("products")
    .update(payload)
    .eq("id", productId);
  query = vendorId
    ? query.eq("vendor_id", vendorId)
    : query.is("vendor_id", null);
  const { data, error } = await query.select("*").single();

  if (error) throw mapProductWriteError(error, input.slug ?? "");
  const product = mapProductRow(data);
  if (input.publish || product.status === "live") {
    scheduleProductEmbeddingRefresh(product.id);
  }
  return product;
}

export async function deleteVendorProduct(
  productId: string,
  vendorId: string | null,
  db?: SupabaseClient,
): Promise<void> {
  const supabase = db ?? (await createClient());
  let query = supabase
    .from("products")
    .delete()
    .eq("id", productId);
  query = vendorId
    ? query.eq("vendor_id", vendorId)
    : query.is("vendor_id", null);
  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Product not found or already deleted.");
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
  productVendorMap: Map<
    string,
    {
      vendorId: string | null;
      name: string;
      segment: string;
      vendorOriginalPrice: number | null;
      listPrice: number;
    }
  >,
  options?: { paymentPaid?: boolean },
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const fulfillmentStatus = options?.paymentPaid
    ? "awaiting_hub_delivery"
    : "awaiting_payment";

  const rows = items
    .map((item) => {
      const meta = productVendorMap.get(item.productId);
      if (!meta?.vendorId) return null;
      const payoutUnit =
        meta.vendorOriginalPrice != null && meta.vendorOriginalPrice > 0
          ? meta.vendorOriginalPrice
          : meta.listPrice > 0
            ? meta.listPrice
            : item.price;
      const vendorEarnings = payoutUnit * item.quantity;
      const displayLine = item.price * item.quantity;
      const sizeLabel = item.size ? ` (${item.size})` : "";
      return {
        order_id: orderId,
        vendor_id: meta.vendorId,
        product_id: item.productId,
        product_name: `${item.name}${sizeLabel}`,
        segment: item.segment === "after_dark" ? "after_dark" : "gifting",
        quantity: item.quantity,
        unit_price: item.price,
        line_total: displayLine,
        vendor_earnings: vendorEarnings,
        fulfillment_status: fulfillmentStatus,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  if (rows.length === 0) return;

  const { data: inserted, error } = await admin
    .from("vendor_order_items")
    .insert(rows)
    .select("id, vendor_id, vendor_earnings");

  if (error) {
    console.error("[vendor_order_items]", error.message);
    return;
  }

  const earnings = (inserted ?? []).map((row) => ({
    vendor_id: row.vendor_id,
    vendor_order_item_id: row.id,
    gross_amount: row.vendor_earnings,
    platform_fee: 0,
    net_amount: row.vendor_earnings,
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
    pickupAddress: AddressDetails | null;
    returnAddress: AddressDetails | null;
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
  if (update.pickupAddress !== undefined) payload.pickup_address = update.pickupAddress;
  if (update.returnAddress !== undefined) payload.return_address = update.returnAddress;

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
): Promise<
  Map<
    string,
    {
      vendorId: string | null;
      name: string;
      segment: string;
      vendorOriginalPrice: number | null;
      listPrice: number;
    }
  >
> {
  const admin = createAdminClient();
  const map = new Map<
    string,
    {
      vendorId: string | null;
      name: string;
      segment: string;
      vendorOriginalPrice: number | null;
      listPrice: number;
    }
  >();
  if (!admin || productIds.length === 0) return map;

  const { data } = await admin
    .from("products")
    .select("id, vendor_id, name, segment, vendor_original_price, price")
    .in("id", productIds);

  for (const row of data ?? []) {
    map.set(String(row.id), {
      vendorId: row.vendor_id ? String(row.vendor_id) : null,
      name: String(row.name),
      segment: String(row.segment ?? "gifting"),
      vendorOriginalPrice:
        row.vendor_original_price != null
          ? Number(row.vendor_original_price)
          : null,
      listPrice: Number(row.price ?? 0),
    });
  }
  return map;
}
