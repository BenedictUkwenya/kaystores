import { compareAtPriceFromDiscount } from "@/lib/products/discount";
import { slugifyProductName } from "@/lib/products/slug";
import {
  hasAnyPlacement,
  sanitizePlacementArrays,
} from "@/lib/shop/taxonomy";
import {
  contentTypeForImageName,
  MAX_PRODUCT_IMAGES,
} from "@/lib/storage/product-images";
import type { VendorProductInput } from "@/lib/vendors/repository";

export const IMPORT_MAX_ROWS = 100;

export const IMPORT_TEMPLATE_CSV = `name,sku,price,brand,description,stock,slug,discount_percent,occasions,recipients,collections
Kay Test Perfume Set,TEST-KAY-001,75000,Kay Stores,"Floral duo in signature gift box",20,,0,birthday|anniversary,for-her,luxury
Kay Test Leather Wallet,TEST-KAY-002,55000,,"Slim wallet — gift-ready",20,,0,birthday|thank-you,for-him,luxury
`;

export type ImportDefaults = {
  brand: string;
  segment: "gifting" | "after_dark";
  occasions: string[];
  recipients: string[];
  collections: string[];
  stock: number;
  publish: boolean;
};

export type ImportImageFile = {
  name: string;
  bytes: Uint8Array;
};

export type PreparedImportRow = {
  index: number;
  name: string;
  sku: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  occasions: string[];
  recipients: string[];
  collections: string[];
  imageFiles: ImportImageFile[];
  errors: string[];
  warnings: string[];
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });
}

function splitList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugifyProductName(base) || "product";
  if (!taken.has(root)) return root;
  let i = 2;
  while (taken.has(`${root}-${i}`)) i += 1;
  return `${root}-${i}`;
}

function fileBaseName(path: string): string {
  const name = path.replace(/\\/g, "/").split("/").pop() ?? path;
  return name;
}

function matchImagesToSku(
  sku: string,
  files: ImportImageFile[],
): ImportImageFile[] {
  const needle = sku.trim().toLowerCase();
  const matched = files
    .map((file) => {
      const base = fileBaseName(file.name);
      const withoutExt = base.replace(/\.[^.]+$/, "").toLowerCase();
      if (withoutExt === needle) return { file, order: 0 };
      const suffix = withoutExt.slice(needle.length);
      if (
        withoutExt.startsWith(needle) &&
        /^-\d+$/.test(suffix)
      ) {
        return { file, order: Number(suffix.slice(1)) };
      }
      return null;
    })
    .filter((item): item is { file: ImportImageFile; order: number } =>
      Boolean(item),
    )
    .sort((a, b) => a.order - b.order)
    .map((item) => item.file);

  return matched.slice(0, MAX_PRODUCT_IMAGES);
}

export function prepareImportRows(input: {
  csvText: string;
  defaults: ImportDefaults;
  images: ImportImageFile[];
  existingSkus: Set<string>;
  existingSlugs: Set<string>;
}): PreparedImportRow[] {
  const records = parseCsv(input.csvText);
  const usedSkus = new Set(input.existingSkus);
  const usedSlugs = new Set(input.existingSlugs);
  const rows: PreparedImportRow[] = [];

  if (records.length > IMPORT_MAX_ROWS) {
    throw new Error(
      `Import is limited to ${IMPORT_MAX_ROWS} products at a time.`,
    );
  }

  records.forEach((record, i) => {
    const index = i + 2; // header is line 1
    const name = (record.name ?? "").trim();
    const sku = (record.sku ?? "").trim();
    const brand = (record.brand ?? "").trim() || input.defaults.brand.trim();
    const price = Number(record.price);
    const stockRaw = record.stock?.trim();
    const stock = stockRaw
      ? Math.floor(Number(stockRaw))
      : Math.floor(input.defaults.stock);
    const discount = Number(record.discount_percent || 0);
    const csvDescription = (record.description ?? "").trim();
    const description =
      csvDescription || (name && brand ? `${name} by ${brand}.` : "");
    const placement = sanitizePlacementArrays({
      occasions: splitList(record.occasions).length
        ? splitList(record.occasions)
        : input.defaults.occasions,
      recipients: splitList(record.recipients).length
        ? splitList(record.recipients)
        : input.defaults.recipients,
      collections: splitList(record.collections).length
        ? splitList(record.collections)
        : input.defaults.collections,
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name) errors.push("Missing name.");
    if (!sku) errors.push("Missing SKU.");
    if (!Number.isFinite(price) || price <= 0) errors.push("Price must be a number greater than 0.");
    if (!Number.isFinite(stock) || stock < 1) errors.push("Stock must be at least 1.");
    if (!brand) errors.push("Missing brand (set a default or fill the CSV column).");
    if (input.defaults.publish && !hasAnyPlacement(placement)) {
      errors.push("Choose at least one category in defaults or the CSV.");
    }

    const skuKey = sku.toLowerCase();
    if (sku && usedSkus.has(skuKey)) {
      errors.push("SKU already exists.");
    } else if (sku) {
      usedSkus.add(skuKey);
    }

    const slug = uniqueSlug(record.slug?.trim() || name, usedSlugs);
    usedSlugs.add(slug);

    const imageFiles = sku ? matchImagesToSku(sku, input.images) : [];
    if (!csvDescription && description) {
      warnings.push("Description was generated from the name and brand.");
    }

    if (input.defaults.publish && imageFiles.length === 0) {
      errors.push(
        `No image named ${sku}.jpg (or ${sku}-2.jpg). Publishing needs at least one photo.`,
      );
    }

    for (const file of imageFiles) {
      if (!contentTypeForImageName(file.name)) {
        errors.push(`${fileBaseName(file.name)} is not a supported image type.`);
      }
    }

    if (discount < 0 || discount >= 100) {
      errors.push("discount_percent must be 0–99.");
    }

    rows.push({
      index,
      name,
      sku,
      slug,
      brand,
      description,
      price: Number.isFinite(price) ? Math.round(price) : 0,
      compareAtPrice: compareAtPriceFromDiscount(
        Number.isFinite(price) ? price : 0,
        Number.isFinite(discount) ? discount : 0,
      ),
      stock: Number.isFinite(stock) ? stock : 0,
      occasions: placement.occasions,
      recipients: placement.recipients,
      collections: placement.collections,
      imageFiles,
      errors,
      warnings,
    });
  });

  return rows;
}

export function toVendorProductInput(
  row: PreparedImportRow,
  defaults: ImportDefaults,
  images: string[],
): VendorProductInput {
  return {
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    images,
    stockQuantity: row.stock,
    occasions: row.occasions,
    recipients: row.recipients,
    collections: row.collections,
    segment: defaults.segment,
    publish: defaults.publish,
  };
}
