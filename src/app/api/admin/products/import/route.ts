import { apiErrorResponse, requireAdmin, AuthError } from "@/lib/auth/roles";
import { fetchVendorById } from "@/lib/admin/repository";
import { collectImportImages } from "@/lib/admin/import-images";
import {
  prepareImportRows,
  toVendorProductInput,
  type ImportDefaults,
} from "@/lib/admin/product-import";
import { prepareVendorProductInput } from "@/lib/products/vendor-placement";
import { uploadProductImageAdmin } from "@/lib/storage/product-images";
import {
  createVendorProductAdmin,
  fetchProductSkuAndSlugSets,
} from "@/lib/vendors/repository";

export const maxDuration = 60;

function parseDefaults(raw: string | null): ImportDefaults {
  const parsed = raw ? (JSON.parse(raw) as Partial<ImportDefaults>) : {};
  const stock = Math.max(1, Math.floor(Number(parsed.stock) || 20));
  return {
    brand: String(parsed.brand ?? "").trim(),
    segment: parsed.segment === "after_dark" ? "after_dark" : "gifting",
    occasions: Array.isArray(parsed.occasions) ? parsed.occasions.map(String) : [],
    recipients: Array.isArray(parsed.recipients) ? parsed.recipients.map(String) : [],
    collections: Array.isArray(parsed.collections)
      ? parsed.collections.map(String)
      : [],
    stock,
    publish: parsed.publish !== false,
  };
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const vendorId = String(form.get("vendorId") ?? "").trim();
    const dryRun = String(form.get("dryRun") ?? "") === "true";
    const skipIndexes = new Set(
      String(form.get("skipIndexes") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0),
    );

    if (!vendorId) {
      return Response.json({ error: "Pick a vendor first." }, { status: 400 });
    }

    const vendor = await fetchVendorById(vendorId);
    if (!vendor || vendor.status !== "approved") {
      throw new AuthError("Approved vendor not found.", 404);
    }

    let defaults: ImportDefaults;
    try {
      defaults = parseDefaults(String(form.get("defaults") ?? "{}"));
    } catch {
      return Response.json({ error: "Invalid defaults payload." }, { status: 400 });
    }

    if (!defaults.brand) defaults.brand = vendor.businessName;
    if (defaults.segment === "after_dark" && !vendor.canListAfterDark) {
      defaults.segment = "gifting";
    }

    const csvFile = form.get("csv");
    if (!(csvFile instanceof File) || csvFile.size === 0) {
      return Response.json({ error: "Upload a CSV file." }, { status: 400 });
    }
    const csvText = await csvFile.text();

    const imageUploads: File[] = [];
    for (const [key, value] of form.entries()) {
      if (key !== "images" && key !== "zip") continue;
      if (value instanceof File && value.size > 0) imageUploads.push(value);
    }

    const images = await collectImportImages(imageUploads);
    const { skus, slugs } = await fetchProductSkuAndSlugSets();
    const rows = prepareImportRows({
      csvText,
      defaults,
      images,
      existingSkus: skus,
      existingSlugs: slugs,
    });

    const preview = rows.map((row) => ({
      index: row.index,
      name: row.name,
      sku: row.sku,
      slug: row.slug,
      price: row.price,
      stock: row.stock,
      brand: row.brand,
      imageCount: row.imageFiles.length,
      errors: row.errors,
      warnings: row.warnings,
    }));

    if (dryRun) {
      return Response.json({
        dryRun: true,
        vendor: { id: vendor.id, businessName: vendor.businessName },
        defaults,
        rows: preview,
        readyCount: preview.filter((r) => r.errors.length === 0).length,
      });
    }

    const created: { name: string; sku: string; slug: string }[] = [];
    const errors: { index: number; sku: string; error: string }[] = [];

    for (const row of rows) {
      if (skipIndexes.has(row.index) || row.errors.length > 0) continue;
      try {
        const urls: string[] = [];
        for (const file of row.imageFiles) {
          urls.push(
            await uploadProductImageAdmin(vendor.id, file.bytes, file.name),
          );
        }
        const product = await createVendorProductAdmin(
          vendor.id,
          prepareVendorProductInput(toVendorProductInput(row, defaults, urls)),
        );
        created.push({
          name: product.name,
          sku: product.sku,
          slug: product.slug,
        });
      } catch (err) {
        errors.push({
          index: row.index,
          sku: row.sku,
          error: err instanceof Error ? err.message : "Could not create product.",
        });
      }
    }

    return Response.json({
      dryRun: false,
      created,
      errors,
      skipped: rows.filter(
        (r) => skipIndexes.has(r.index) || r.errors.length > 0,
      ).length,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
