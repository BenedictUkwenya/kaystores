/** Fixed catalog attribute lists for vendor/admin product forms and search. */

export const PRODUCT_TYPES = [
  "Watch",
  "Phone",
  "Sneaker",
  "Slide",
  "Sandal",
  "Loafer",
  "Boot",
  "Necklace",
  "Bracelet",
  "Ring",
  "Earring",
  "Bag",
  "Wallet",
  "Perfume",
  "Other",
] as const;

export const MASTER_CATEGORIES = [
  "Footwear",
  "Jewelry",
  "Phone",
  "Watch",
  "Bag",
  "Beauty",
  "Other",
] as const;

export const PRODUCT_COLORS = [
  "Black",
  "White",
  "Gold",
  "Silver",
  "Rose Gold",
  "Pink",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Beige",
  "Orange",
  "Purple",
  "Grey",
  "Multicolor",
] as const;

export const PRODUCT_CONDITIONS = [
  "Brand New",
  "UK Used",
  "Pre-Owned",
  "Refurbished",
] as const;

export const PRODUCT_AUDIENCES = ["Men's", "Women's", "Unisex"] as const;

export const FOOTWEAR_SIZES = [
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
] as const;

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Master category → product types that typically belong there. */
export const TYPES_BY_MASTER: Record<string, readonly string[]> = {
  Footwear: ["Sneaker", "Slide", "Sandal", "Loafer", "Boot", "Other"],
  Jewelry: ["Necklace", "Bracelet", "Ring", "Earring", "Other"],
  Phone: ["Phone", "Other"],
  Watch: ["Watch", "Other"],
  Bag: ["Bag", "Wallet", "Other"],
  Beauty: ["Perfume", "Other"],
  Other: PRODUCT_TYPES,
};

/** Spec keys that appear for certain master categories. */
export const SPECS_BY_MASTER: Record<string, { key: string; options: string[] }[]> = {
  Phone: [
    {
      key: "Storage",
      options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
    },
  ],
  Footwear: [
    {
      key: "Material",
      options: ["Leather", "Suede", "Canvas", "Synthetic", "Rubber", "Textile"],
    },
  ],
  Watch: [
    {
      key: "Material",
      options: ["Leather", "Stainless Steel", "Gold Plated", "Titanium", "Rubber"],
    },
  ],
};

/** Search synonyms so "shoe" finds Footwear / Slide / Sneaker etc. */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  shoe: ["footwear", "sneaker", "slide", "sandal", "loafer", "boot", "shoes"],
  shoes: ["footwear", "sneaker", "slide", "sandal", "loafer", "boot", "shoe"],
  footwear: ["shoe", "shoes", "sneaker", "slide", "sandal", "loafer", "boot"],
  sneaker: ["footwear", "shoe", "shoes"],
  slide: ["footwear", "shoe", "shoes", "sandal"],
  sandal: ["footwear", "shoe", "shoes", "slide"],
  phone: ["mobile", "iphone", "smartphone", "android"],
  mobile: ["phone", "smartphone"],
  watch: ["timepiece", "wristwatch"],
  jewelry: ["jewellery", "necklace", "bracelet", "ring", "earring"],
  jewellery: ["jewelry", "necklace", "bracelet", "ring", "earring"],
  bag: ["handbag", "purse", "tote"],
};

export type CatalogAttributeInput = {
  productType?: string | null;
  masterCategory?: string | null;
  color?: string | null;
  condition?: string | null;
  audience?: string | null;
  brand?: string | null;
  name?: string | null;
  specs?: Record<string, string>;
  sizeOptions?: string[];
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

/** Build denormalized keywords used by catalog search. */
export function buildSearchKeywords(input: CatalogAttributeInput): string[] {
  const keywords = new Set<string>();

  const add = (value?: string | null) => {
    if (!value?.trim()) return;
    const raw = norm(value);
    keywords.add(raw);
    for (const part of raw.split(/[\s/_-]+/).filter(Boolean)) {
      keywords.add(part);
    }
  };

  add(input.productType);
  add(input.masterCategory);
  add(input.color);
  add(input.condition);
  add(input.audience);
  add(input.brand);
  add(input.name);
  for (const size of input.sizeOptions ?? []) add(size);
  for (const [key, value] of Object.entries(input.specs ?? {})) {
    add(key);
    add(value);
  }

  // Expand known synonyms for master category / type so general queries work.
  for (const seed of [...keywords]) {
    const extras = SEARCH_SYNONYMS[seed];
    if (extras) extras.forEach((x) => keywords.add(x));
  }

  return [...keywords].filter(Boolean).sort();
}

export function expandSearchQuery(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,_/+-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    const synonyms = SEARCH_SYNONYMS[token];
    if (synonyms) synonyms.forEach((s) => expanded.add(s));
  }
  if (expanded.size === 0 && query.trim()) {
    expanded.add(query.trim().toLowerCase());
  }
  return [...expanded];
}

/** Cheap typo tolerance for short tokens (edit distance ≤ 1 or 2). */
export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return true;
  if (h.includes(n)) return true;
  if (n.length < 3) return false;

  // Token-level: any word in haystack within edit distance of needle
  const words = h.split(/[^a-z0-9]+/).filter(Boolean);
  const maxDist = n.length <= 4 ? 1 : 2;
  return words.some((word) => editDistance(word, n) <= maxDist);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

export function productSearchBlob(product: {
  name: string;
  brand: string;
  description: string;
  product_type?: string | null;
  master_category?: string | null;
  color?: string | null;
  condition?: string | null;
  audience?: string | null;
  tags?: string[];
  search_keywords?: string[];
  specs?: Record<string, string>;
  size_options?: string[];
}): string {
  return [
    product.name,
    product.brand,
    product.description,
    product.product_type,
    product.master_category,
    product.color,
    product.condition,
    product.audience,
    ...(product.tags ?? []),
    ...(product.search_keywords ?? []),
    ...(product.size_options ?? []),
    ...Object.entries(product.specs ?? {}).flatMap(([k, v]) => [k, v]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesProductSearch(
  product: Parameters<typeof productSearchBlob>[0],
  query: string,
): boolean {
  const terms = expandSearchQuery(query);
  if (terms.length === 0) return true;
  const blob = productSearchBlob(product);
  return terms.some(
    (term) => blob.includes(term) || fuzzyIncludes(blob, term),
  );
}
