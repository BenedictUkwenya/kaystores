import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
  type ShippingSettingsInput,
} from "@/types/shipping-settings";

function mapRow(row: Record<string, unknown> | null): ShippingSettings {
  if (!row) return { ...DEFAULT_SHIPPING_SETTINGS };
  return {
    terminalEnabled: row.terminal_enabled !== false,
    manualEnabled: row.manual_enabled !== false,
    manualFee: Math.max(0, Math.floor(Number(row.manual_fee) || 0)),
    manualLabel: String(row.manual_label || DEFAULT_SHIPPING_SETTINGS.manualLabel),
    manualEta:
      row.manual_eta != null && String(row.manual_eta).trim()
        ? String(row.manual_eta)
        : null,
  };
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const admin = createAdminClient();
  if (!admin) return { ...DEFAULT_SHIPPING_SETTINGS };
  const { data, error } = await admin
    .from("shipping_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    // Table may not exist before migration 033.
    return { ...DEFAULT_SHIPPING_SETTINGS };
  }
  return mapRow(data as Record<string, unknown> | null);
}

export async function updateShippingSettings(
  input: ShippingSettingsInput,
): Promise<ShippingSettings> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client not configured.");

  const current = await getShippingSettings();
  const next: ShippingSettings = {
    terminalEnabled:
      input.terminalEnabled != null
        ? Boolean(input.terminalEnabled)
        : current.terminalEnabled,
    manualEnabled:
      input.manualEnabled != null
        ? Boolean(input.manualEnabled)
        : current.manualEnabled,
    manualFee:
      input.manualFee != null
        ? Math.max(0, Math.floor(Number(input.manualFee) || 0))
        : current.manualFee,
    manualLabel:
      input.manualLabel != null && String(input.manualLabel).trim()
        ? String(input.manualLabel).trim()
        : current.manualLabel,
    manualEta:
      input.manualEta !== undefined
        ? input.manualEta && String(input.manualEta).trim()
          ? String(input.manualEta).trim()
          : null
        : current.manualEta,
  };

  if (!next.terminalEnabled && !next.manualEnabled) {
    throw new Error("Enable at least one delivery option (Terminal or Kay delivery).");
  }

  const { data, error } = await admin
    .from("shipping_settings")
    .upsert({
      id: 1,
      terminal_enabled: next.terminalEnabled,
      manual_enabled: next.manualEnabled,
      manual_fee: next.manualFee,
      manual_label: next.manualLabel,
      manual_eta: next.manualEta,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save shipping settings.");
  }
  return mapRow(data as Record<string, unknown>);
}
