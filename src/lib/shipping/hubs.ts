import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AddressDetails } from "@/types/order";
import type { ShippingHub, ShippingHubInput } from "@/types/shipping";

export type { ShippingHub, ShippingHubInput };

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "hub";
}

export function normalizeStateName(state: string) {
  let s = state
    .trim()
    .toLowerCase()
    .replace(/\s+state$/, "")
    .replace(/\s+/g, " ");

  // Common Nigeria aliases so hub matching is forgiving
  if (
    s === "fct" ||
    s === "abuja fct" ||
    s === "federal capital territory" ||
    s === "abuja federal capital territory"
  ) {
    return "abuja";
  }
  if (
    s === "portharcourt" ||
    s === "port harcourt" ||
    s === "ph" ||
    s === "rivers"
  ) {
    return "rivers";
  }
  if (s === "niger state") return "niger";

  return s;
}

/** Expand a configured service-state label into match keys. */
function serviceStateKeys(label: string): string[] {
  const n = normalizeStateName(label);
  if (n === "abuja") return ["abuja", "fct"];
  if (n === "rivers") return ["rivers", "port harcourt", "portharcourt"];
  return [n];
}

function mapHubRow(row: Record<string, unknown>): ShippingHub {
  const address =
    row.address && typeof row.address === "object"
      ? (row.address as AddressDetails)
      : {
          line1: "",
          city: "",
          state: "",
          country: "Nigeria",
        };
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    address,
    contactName: String(row.contact_name),
    contactEmail: String(row.contact_email),
    contactPhone: String(row.contact_phone),
    serviceStates: Array.isArray(row.service_states)
      ? (row.service_states as string[])
      : [],
    isDefault: Boolean(row.is_default),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function envFallbackHub(): ShippingHub | null {
  const pickup = process.env.TERMINAL_HUB_ADDRESS_JSON?.trim();
  const name = process.env.TERMINAL_HUB_CONTACT_NAME?.trim();
  const email = process.env.TERMINAL_HUB_CONTACT_EMAIL?.trim();
  const phone = process.env.TERMINAL_HUB_CONTACT_PHONE?.trim();
  if (!pickup || !name || !email || !phone) return null;
  try {
    const address = JSON.parse(pickup) as AddressDetails;
    return {
      id: "env-default",
      name: "Kay Hub",
      slug: "env-default",
      address,
      contactName: name,
      contactEmail: email,
      contactPhone: phone,
      serviceStates: [],
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    };
  } catch {
    return null;
  }
}

export async function listShippingHubs(opts?: {
  activeOnly?: boolean;
}): Promise<ShippingHub[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  let query = admin.from("shipping_hubs").select("*").order("sort_order", {
    ascending: true,
  });
  if (opts?.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) {
    // Table may not exist yet before migration 030.
    if (error.message.toLowerCase().includes("shipping_hubs")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => mapHubRow(row as Record<string, unknown>));
}

/**
 * Pick origin hub for a customer destination:
 * 1) active hub whose service_states includes destination state
 * 2) active default hub
 * 3) first active hub
 * 4) env TERMINAL_HUB_* fallback
 */
export async function resolveShippingHub(
  destinationState: string,
): Promise<ShippingHub> {
  const hubs = await listShippingHubs({ activeOnly: true });
  const target = normalizeStateName(destinationState);

  if (hubs.length) {
    const byState = hubs.find((hub) =>
      hub.serviceStates.some((s) =>
        serviceStateKeys(s).includes(target),
      ),
    );
    if (byState) return byState;

    const catchAll = hubs.find(
      (hub) => hub.serviceStates.length === 0 && hub.isDefault,
    );
    if (catchAll) return catchAll;

    const defaultHub = hubs.find((hub) => hub.isDefault);
    if (defaultHub) return defaultHub;

    const national = hubs.find((hub) => hub.serviceStates.length === 0);
    if (national) return national;

    return hubs[0];
  }

  const envHub = envFallbackHub();
  if (envHub) return envHub;

  throw new Error(
    "No shipping hubs configured. Add hubs in Admin → Hubs, or set TERMINAL_HUB_* env vars.",
  );
}

function validateHubInput(input: ShippingHubInput) {
  if (!input.name.trim()) throw new Error("Hub name is required.");
  if (!input.address?.line1?.trim() || !input.address.city?.trim() || !input.address.state?.trim()) {
    throw new Error("Hub street, city, and state are required.");
  }
  if (!input.contactName.trim() || !input.contactEmail.trim() || !input.contactPhone.trim()) {
    throw new Error("Hub contact name, email, and phone are required.");
  }
}

export async function createShippingHub(
  input: ShippingHubInput,
): Promise<ShippingHub> {
  validateHubInput(input);
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client not configured.");

  if (input.isDefault) {
    await admin
      .from("shipping_hubs")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("is_default", true);
  }

  const { data, error } = await admin
    .from("shipping_hubs")
    .insert({
      name: input.name.trim(),
      slug: slugify(input.slug?.trim() || input.name),
      address: {
        ...input.address,
        country: input.address.country || "Nigeria",
      },
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      contact_phone: input.contactPhone.trim(),
      service_states: (input.serviceStates ?? [])
        .map((s) => s.trim())
        .filter(Boolean),
      is_default: Boolean(input.isDefault),
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create hub.");
  return mapHubRow(data as Record<string, unknown>);
}

export async function updateShippingHub(
  id: string,
  input: Partial<ShippingHubInput>,
): Promise<ShippingHub> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client not configured.");

  if (input.isDefault) {
    await admin
      .from("shipping_hubs")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("is_default", true)
      .neq("id", id);
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name != null) payload.name = input.name.trim();
  if (input.slug != null) payload.slug = slugify(input.slug);
  if (input.address != null) {
    payload.address = {
      ...input.address,
      country: input.address.country || "Nigeria",
    };
  }
  if (input.contactName != null) payload.contact_name = input.contactName.trim();
  if (input.contactEmail != null) {
    payload.contact_email = input.contactEmail.trim().toLowerCase();
  }
  if (input.contactPhone != null) payload.contact_phone = input.contactPhone.trim();
  if (input.serviceStates != null) {
    payload.service_states = input.serviceStates.map((s) => s.trim()).filter(Boolean);
  }
  if (input.isDefault != null) payload.is_default = input.isDefault;
  if (input.isActive != null) payload.is_active = input.isActive;
  if (input.sortOrder != null) payload.sort_order = input.sortOrder;

  const { data, error } = await admin
    .from("shipping_hubs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not update hub.");
  return mapHubRow(data as Record<string, unknown>);
}

export async function deleteShippingHub(id: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client not configured.");
  const { error } = await admin.from("shipping_hubs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
