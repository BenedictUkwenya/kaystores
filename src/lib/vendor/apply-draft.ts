export const VENDOR_APPLY_DRAFT_KEY = "kay_vendor_apply_draft";

export type VendorApplyDraft = {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  catalogDescription: string;
  nin?: string;
  inviteToken?: string;
};

export function saveVendorApplyDraft(draft: VendorApplyDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VENDOR_APPLY_DRAFT_KEY, JSON.stringify(draft));
}

export function readVendorApplyDraft(): VendorApplyDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(VENDOR_APPLY_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VendorApplyDraft;
  } catch {
    return null;
  }
}

export function clearVendorApplyDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(VENDOR_APPLY_DRAFT_KEY);
}

export async function submitVendorApplicationRequest(
  draft: VendorApplyDraft,
): Promise<{ status: string }> {
  const res = await fetch("/api/vendor/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Application failed");
  }
  return { status: String(data.vendor?.status ?? "pending") };
}
